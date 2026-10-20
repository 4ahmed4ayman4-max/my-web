using Infrastructure.Context;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseSeeder");

        try
        {
            // =====================================================
            // 0. DETECT MIGRATION CHANGE
            // =====================================================
            var lastMigration = context.Database
                .GetAppliedMigrations()
                .LastOrDefault() ?? "none";

            var seedRecord = await context.SeedHistories.FirstOrDefaultAsync();

            if (seedRecord != null && seedRecord.LastMigration == lastMigration)
            {
                logger.LogInformation("⏩ Seeding skipped - already up to date with migration '{Migration}'.", lastMigration);
                return;
            }

            logger.LogInformation("🔄 New migration detected ({Old} -> {New}). Clearing and re-seeding...",
                seedRecord?.LastMigration ?? "none", lastMigration);

            // =====================================================
            // 0.1 CLEAR OLD DATA (order matters - FKs!)
            // =====================================================
            await ClearAllDataAsync(context, userManager, logger);

            // =====================================================
            // 1. SEED ROLES
            // =====================================================
            string[] roles = { "Admin", "Super_viser", "Customer" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new ApplicationRole
                    {
                        Name = role,
                        Description = $"{role} role",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // =====================================================
            // 2. SEED ADMIN USER
            // =====================================================
            const string adminEmail = "admin@storeapp.com";
            const string adminPassword = "Admin@123456";

            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FirstName = "System",
                    LastName = "Admin",
                    PhoneNumber = "+201009037432",
                    CreatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                    await userManager.AddToRoleAsync(adminUser, "Admin");
            }

            // =====================================================
            // 3. SEED 24 CUSTOMER USERS
            // =====================================================
            var firstNames = new[]
            {
                "Ahmed", "Mohamed", "Youssef", "Omar", "Ali", "Hassan", "Khaled", "Mahmoud",
                "Sara", "Fatma", "Nour", "Layla", "Mariam", "Hana", "Aya", "Dina",
                "Yasmin", "Rana", "Salma", "Nada", "Karim", "Tarek", "Amr", "Ziad"
            };

            var lastNames = new[]
            {
                "Ibrahim", "Hassan", "Ali", "Mahmoud", "Sayed", "Fouad", "Adel", "Nasser",
                "Kamal", "Samir", "Farid", "Rashid", "Zaki", "Lotfy", "Sabry", "Shawky",
                "Mansour", "Fahmy", "Gaber", "Riad", "Hamdy", "Salem", "Ragab", "Bakr"
            };

            var cities = new[]
            {
                "Cairo", "Alexandria", "Giza", "Luxor", "Aswan",
                "Port Said", "Suez", "Ismailia", "Mansoura", "Tanta"
            };

            var createdCustomers = new List<ApplicationUser>();

            for (int i = 0; i < 24; i++)
            {
                var email = $"customer{i + 1}@storeapp.com";
                var existing = await userManager.FindByEmailAsync(email);

                if (existing != null)
                {
                    createdCustomers.Add(existing);
                    continue;
                }

                var user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    FirstName = firstNames[i % firstNames.Length],
                    LastName = lastNames[i % lastNames.Length],
                    PhoneNumber = $"+2010{i:D8}",
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 180))
                };

                var result = await userManager.CreateAsync(user, "Customer@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Customer");
                    createdCustomers.Add(user);

                    context.Carts.Add(new Cart
                    {
                        UserId = user.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await context.SaveChangesAsync();

            // =====================================================
            // 4. SEED 20 CATEGORIES
            // =====================================================
            var categoryData = new (string Name, string Description)[]
            {
                ("Electronics",         "Smartphones, laptops, tablets, and gadgets"),
                ("Mobile Phones",       "Latest smartphones from all brands"),
                ("Laptops",             "Notebooks and ultrabooks for work and gaming"),
                ("Headphones",          "Wireless and wired audio devices"),
                ("Cameras",             "DSLR, mirrorless, and action cameras"),
                ("Wearables",           "Smartwatches and fitness trackers"),
                ("Clothing",            "Fashion for men and women"),
                ("Men's Fashion",       "Shirts, pants, suits, and accessories"),
                ("Women's Fashion",     "Dresses, tops, and accessories"),
                ("Shoes",               "Sneakers, boots, and formal shoes"),
                ("Books",               "Fiction, non-fiction, and educational"),
                ("Home & Kitchen",      "Furniture, cookware, and decor"),
                ("Sports & Outdoors",   "Fitness and outdoor equipment"),
                ("Beauty & Personal",   "Skincare, makeup, and grooming"),
                ("Toys & Games",        "Kids toys and board games"),
                ("Baby Products",       "Baby care and nursery essentials"),
                ("Automotive",          "Car accessories and tools"),
                ("Pet Supplies",        "Food and accessories for pets"),
                ("Grocery",             "Everyday groceries and snacks"),
                ("Health & Wellness",   "Supplements and health devices")
            };

            var categories = categoryData.Select(c => new Category
            {
                Name = c.Name,
                Description = c.Description,
                ImageUrl = $"https://placehold.co/400x300?text={Uri.EscapeDataString(c.Name)}",
                CreatedAt = DateTime.UtcNow
            }).ToList();

            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();

            var allCategories = context.Categories.ToList();

            // =====================================================
            // 5. SEED 100 PRODUCTS
            // =====================================================
            var productTemplates = new Dictionary<string, string[]>
            {
                ["Electronics"] = new[] { "Smart TV", "Bluetooth Speaker", "Power Bank", "Smart Home Hub", "Wireless Charger" },
                ["Mobile Phones"] = new[] { "iPhone 15 Pro", "Samsung Galaxy S24", "Google Pixel 8", "Xiaomi 14 Pro", "OnePlus 12" },
                ["Laptops"] = new[] { "MacBook Pro M3", "Dell XPS 15", "HP Spectre x360", "Lenovo ThinkPad X1", "Asus ROG Zephyrus" },
                ["Headphones"] = new[] { "AirPods Pro 2", "Sony WH-1000XM5", "Bose QuietComfort", "JBL Tune 770NC", "Sennheiser Momentum" },
                ["Cameras"] = new[] { "Canon EOS R5", "Nikon Z6 II", "Sony A7 IV", "Fujifilm X-T5", "GoPro Hero 12" },
                ["Wearables"] = new[] { "Apple Watch Series 9", "Samsung Galaxy Watch 6", "Garmin Fenix 7", "Fitbit Versa 4", "Amazfit GTR 4" },
                ["Clothing"] = new[] { "Cotton T-Shirt", "Denim Jacket", "Hoodie", "Polo Shirt", "Cargo Pants" },
                ["Men's Fashion"] = new[] { "Formal Suit", "Leather Belt", "Dress Shirt", "Chinos", "Wool Coat" },
                ["Women's Fashion"] = new[] { "Summer Dress", "Handbag", "Sunglasses", "Silk Scarf", "High Heels" },
                ["Shoes"] = new[] { "Nike Air Max", "Adidas Ultraboost", "New Balance 990", "Puma RS-X", "Converse Chuck 70" },
                ["Books"] = new[] { "Clean Code", "The Pragmatic Programmer", "Design Patterns", "Refactoring", "Domain-Driven Design" },
                ["Home & Kitchen"] = new[] { "Coffee Maker", "Air Fryer", "Blender", "Toaster", "Rice Cooker" },
                ["Sports & Outdoors"] = new[] { "Yoga Mat", "Dumbbell Set", "Resistance Bands", "Treadmill", "Bicycle" },
                ["Beauty & Personal"] = new[] { "Face Serum", "Moisturizer", "Perfume", "Lipstick Set", "Hair Dryer" },
                ["Toys & Games"] = new[] { "LEGO Set", "Remote Car", "Board Game", "Puzzle 1000pcs", "Action Figure" },
                ["Baby Products"] = new[] { "Baby Stroller", "Diaper Bag", "Baby Monitor", "Bottle Set", "Crib" },
                ["Automotive"] = new[] { "Car Vacuum", "Dash Cam", "Phone Mount", "Jump Starter", "Tire Inflator" },
                ["Pet Supplies"] = new[] { "Dog Food Premium", "Cat Tree", "Pet Carrier", "Chew Toy", "Aquarium Filter" },
                ["Grocery"] = new[] { "Olive Oil 1L", "Coffee Beans", "Organic Honey", "Mixed Nuts", "Dark Chocolate" },
                ["Health & Wellness"] = new[] { "Vitamin D3", "Omega-3", "Protein Powder", "Multivitamin", "Collagen" }
            };

            var products = new List<Product>();
            var skuCounter = 1000;

            foreach (var category in allCategories)
            {
                if (!productTemplates.TryGetValue(category.Name, out var template))
                    template = new[] { "Product 1", "Product 2", "Product 3", "Product 4", "Product 5" };

                for (int i = 0; i < template.Length; i++)
                {
                    var basePrice = Random.Shared.Next(50, 2500);
                    var hasDiscount = Random.Shared.Next(0, 100) < 40;
                    decimal? discountPrice = hasDiscount
                        ? Math.Round(basePrice * 0.8m, 2)
                        : null;

                    var product = new Product
                    {
                        Name = template[i],
                        Description = $"High-quality {template[i]} in the {category.Name} category. " +
                                     "Perfect choice for your daily needs with premium features.",
                        SKU = $"SKU-{skuCounter++}",
                        Price = basePrice,
                        DiscountPrice = discountPrice,
                        StockQuantity = Random.Shared.Next(5, 200),
                        IsActive = true,
                        CategoryId = category.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 120))
                    };

                    product.Images.Add(new ProductImage
                    {
                        ImageUrl = $"https://placehold.co/600x600?text={Uri.EscapeDataString(template[i])}+1",
                        AltText = template[i],
                        IsPrimary = true,
                        DisplayOrder = 1,
                        CreatedAt = DateTime.UtcNow
                    });

                    product.Images.Add(new ProductImage
                    {
                        ImageUrl = $"https://placehold.co/600x600?text={Uri.EscapeDataString(template[i])}+2",
                        AltText = $"{template[i]} - side view",
                        IsPrimary = false,
                        DisplayOrder = 2,
                        CreatedAt = DateTime.UtcNow
                    });

                    products.Add(product);
                }
            }

            context.Products.AddRange(products);
            await context.SaveChangesAsync();

            // =====================================================
            // 6. SEED 30 ORDERS
            // =====================================================
            var allProducts = context.Products.ToList();
            var statuses = Enum.GetValues<OrderStatus>();
            var citiesArr = new[] { "Cairo", "Alexandria", "Giza", "Luxor", "Aswan", "Port Said" };

            var orders = new List<Order>();
            var orderCounter = 1000;

            for (int i = 0; i < 30; i++)
            {
                var customer = createdCustomers[Random.Shared.Next(createdCustomers.Count)];
                var status = statuses[Random.Shared.Next(statuses.Length)];
                var city = citiesArr[Random.Shared.Next(citiesArr.Length)];

                var order = new Order
                {
                    OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{orderCounter++}",
                    UserId = customer.Id,
                    Status = status,
                    ShippingAddress = $"{Random.Shared.Next(1, 200)} Main Street, {city}, Egypt",
                    Notes = Random.Shared.Next(0, 3) == 0 ? "Please call before delivery." : null,
                    ShippingCost = 25m,
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 90))
                };

                var itemCount = Random.Shared.Next(2, 6);
                var usedProductIds = new HashSet<int>();

                for (int j = 0; j < itemCount; j++)
                {
                    Product product;
                    do
                    {
                        product = allProducts[Random.Shared.Next(allProducts.Count)];
                    } while (usedProductIds.Contains(product.Id));
                    usedProductIds.Add(product.Id);

                    var quantity = Random.Shared.Next(1, 4);
                    var unitPrice = product.DiscountPrice ?? product.Price;

                    order.Items.Add(new OrderItem
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        Quantity = quantity,
                        UnitPrice = unitPrice,
                        CreatedAt = order.CreatedAt
                    });
                }

                order.SubTotal = order.Items.Sum(i => i.Quantity * i.UnitPrice);
                order.TaxAmount = Math.Round(order.SubTotal * 0.14m, 2);
                order.TotalAmount = order.SubTotal + order.ShippingCost + order.TaxAmount;

                if (status == OrderStatus.Shipped || status == OrderStatus.Delivered)
                    order.ShippedAt = order.CreatedAt.AddDays(2);

                if (status == OrderStatus.Delivered)
                    order.DeliveredAt = order.CreatedAt.AddDays(5);

                orders.Add(order);
            }

            context.Orders.AddRange(orders);
            await context.SaveChangesAsync();

            // =====================================================
            // 7. SEED PAYMENTS
            // =====================================================
            var payments = new List<Payment>();
            var payMethods = Enum.GetValues<PaymentMethod>();

            foreach (var order in orders.Where(o =>
                o.Status != OrderStatus.Pending && o.Status != OrderStatus.Cancelled))
            {
                payments.Add(new Payment
                {
                    OrderId = order.Id,
                    TransactionId = $"TXN-{Guid.NewGuid():N}".ToUpper()[..20],
                    Amount = order.TotalAmount,
                    Status = order.Status == OrderStatus.Refunded
                        ? PaymentStatus.Refunded
                        : PaymentStatus.Completed,
                    Method = payMethods[Random.Shared.Next(payMethods.Length)],
                    PaidAt = order.CreatedAt.AddMinutes(Random.Shared.Next(1, 60)),
                    CreatedAt = order.CreatedAt
                });
            }

            if (payments.Any())
            {
                context.Payments.AddRange(payments);
                await context.SaveChangesAsync();
            }

            // =====================================================
            // 8. SAVE MIGRATION MARKER
            // =====================================================
            if (seedRecord == null)
            {
                context.SeedHistories.Add(new SeedHistory
                {
                    LastMigration = lastMigration,
                    SeededAt = DateTime.UtcNow
                });
            }
            else
            {
                seedRecord.LastMigration = lastMigration;
                seedRecord.SeededAt = DateTime.UtcNow;
                seedRecord.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();

            logger.LogInformation("✅ Database seeding completed for migration '{Migration}'.", lastMigration);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Error occurred while seeding the database.");
            throw;
        }
    }

    // =====================================================
    // HELPER: Clear all seeded data
    // =====================================================
    private static async Task ClearAllDataAsync(
    ApplicationDbContext context,
    UserManager<ApplicationUser> userManager,
    ILogger logger)
    {
        logger.LogInformation("🧹 Clearing existing data...");

        // ═══════════════════════════════════════════════════════
        // 1) نمسح الجداول بـ SQL خام بترتيب صريح (FK-safe)
        //    الترتيب من الأعمق للأعلى:
        //    Payments -> OrderItems -> Orders
        //    ProductImages -> CartItems -> Carts -> Products -> Categories
        // ═══════════════════════════════════════════════════════
        await context.Database.ExecuteSqlRawAsync(@"
        -- 1. Payments
        DELETE FROM Payments;

        -- 2. Order items
        DELETE FROM OrderItems;

        -- 3. Orders
        DELETE FROM Orders;

        -- 4. Product images
        DELETE FROM ProductImages;

        -- 5. Cart items
        DELETE FROM CartItems;

        -- 6. Carts
        DELETE FROM Carts;

        -- 7. Products (بعد ما اتمسحت الـ ProductImages والـ CartItems والـ OrderItems)
        DELETE FROM Products;

        -- 8. Deliveries
        DELETE FROM Deliveries;

        -- 9. Refresh tokens
        DELETE FROM RefreshTokens;

        -- 10. Audit logs
        DELETE FROM AuditLogs;

        -- 11. Categories (بعد ما اتمسحت Products)
        DELETE FROM Categories;
    ");

        // ═══════════════════════════════════════════════════════
        // 2) نمسح المستخدمين (ماعدا الـ admin)
        //    بنمر عليهم واحد واحد عشان الـ Identity FKs
        // ═══════════════════════════════════════════════════════
        var users = await userManager.Users
            .Where(u => u.Email != "admin@storeapp.com")
            .ToListAsync();

        foreach (var user in users)
        {
            await userManager.DeleteAsync(user);
        }

        logger.LogInformation("✅ Cleared {Count} users + all related data.", users.Count);
    }
}