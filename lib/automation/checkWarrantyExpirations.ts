import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import PushSubscription from "@/lib/models/PushSubscription";
import { sendPush } from "@/lib/notifications/sendPush";

/**
 * Returns a date that is exactly `days` days from today (midnight UTC).
 */
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Main automation function.
 * Called by /api/cron/check-warranties daily and /api/dev/test-reminders for testing.
 */



export async function checkWarrantyExpirations(): Promise<{
  checked: number;
  notified: number;
  errors: number;
}> {
  await connectToDatabase();

  const target30 = daysFromNow(30);
  const target7  = daysFromNow(7);

  // Date range window: ±1 day to account for timing drift
  function dateRange(target: Date) {
    const start = new Date(target); start.setUTCHours(0, 0, 0, 0);
    const end   = new Date(target); end.setUTCHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }

  // Find products expiring in exactly 30 days (reminder not yet sent)
  const expiring30 = await Product.find({
    warrantyExpiryDate: dateRange(target30),
    reminder30Sent: false,
    warrantyStatus: { $ne: "expired" },
  });

  // Find products expiring in exactly 7 days (reminder not yet sent)
  const expiring7 = await Product.find({
    warrantyExpiryDate: dateRange(target7),
    reminder7Sent: false,
    warrantyStatus: { $ne: "expired" },
  });

  let notified = 0;
  let errors = 0;
  const checked = expiring30.length + expiring7.length;

  console.log(`Warranty check: ${expiring30.length} at 30d, ${expiring7.length} at 7d`);

  // Process 30-day reminders
  for (const product of expiring30) {
    try {
      const subscriptions = await PushSubscription.find({ userId: product.userId });

      if (subscriptions.length === 0) {
        // No push sub — still mark as sent to avoid repeated checks
        await Product.findByIdAndUpdate(product._id, { reminder30Sent: true });
        continue;
      }

      const payload = {
        title: "Warranty Expiring Soon ⏰",
        body: `Your ${product.productName} warranty expires in 30 days.`,
        url: `/product/${product._id}`,
        tag: `warranty-30-${product._id}`,
      };

      let sent = false;
      for (const sub of subscriptions) {
        const ok = await sendPush(sub, payload);
        if (ok) sent = true;
      }

      if (sent) notified++;

      // Mark reminder sent regardless — prevents spam if push partially fails
      await Product.findByIdAndUpdate(product._id, { reminder30Sent: true });
    } catch (err) {
      console.error(`Error processing 30d reminder for product ${product._id}:`, err);
      errors++;
    }
  }

  // Process 7-day reminders
  for (const product of expiring7) {
    try {
      const subscriptions = await PushSubscription.find({ userId: product.userId });

      if (subscriptions.length === 0) {
        await Product.findByIdAndUpdate(product._id, { reminder7Sent: true });
        continue;
      }

      const payload = {
        title: "Warranty Expires in 7 Days 🚨",
        body: `Your ${product.productName} warranty expires in 7 days. Act now!`,
        url: `/product/${product._id}`,
        tag: `warranty-7-${product._id}`,
      };

      let sent = false;
      for (const sub of subscriptions) {
        const ok = await sendPush(sub, payload);
        if (ok) sent = true;
      }

      if (sent) notified++;

      await Product.findByIdAndUpdate(product._id, { reminder7Sent: true });
    } catch (err) {
      console.error(`Error processing 7d reminder for product ${product._id}:`, err);
      errors++;
    }
  }

  console.log(`Done: ${notified} notified, ${errors} errors`);
  return { checked, notified, errors };
}


//v2
// export async function checkWarrantyExpirations(): Promise<{
//   checked: number;
//   notified: number;
//   errors: number;
// }> {
//   const functionStartTime = Date.now();
//   console.log('[WarrantyCheck] ==================================');
//   console.log('[WarrantyCheck] 🔍 STARTING WARRANTY EXPIRATION CHECK');
//   console.log('[WarrantyCheck] ==================================');
  
//   let checked = 0;
//   let notified = 0;
//   let errors = 0;
//   let scannedProducts = {
//     total: 0,
//     thirtyDay: 0,
//     sevenDay: 0,
//     processed: {
//       thirtyDay: 0,
//       sevenDay: 0
//     }
//   };

//   try {
//     await connectToDatabase();
//     console.log('[WarrantyCheck] ✅ Database connected successfully');

//     const target30 = daysFromNow(30);
//     const target7 = daysFromNow(7);

//     console.log('[WarrantyCheck] 📅 Target dates:', {
//       target30: target30.toISOString(),
//       target7: target7.toISOString()
//     });

//     // Date range window: ±1 day to account for timing drift
//     function dateRange(target: Date) {
//       const start = new Date(target);
//       start.setUTCHours(0, 0, 0, 0);
//       const end = new Date(target);
//       end.setUTCHours(23, 59, 59, 999);
//       return { $gte: start, $lte: end };
//     }

//     // ============= 30-DAY SCAN =============
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] 🔍 SCANNING FOR 30-DAY EXPIRATIONS');
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] Query criteria:', {
//       warrantyExpiryDate: {
//         $gte: dateRange(target30).$gte.toISOString(),
//         $lte: dateRange(target30).$lte.toISOString()
//       },
//       reminder30Sent: false,
//       warrantyStatus: { $ne: "expired" }
//     });

//     let expiring30 = [];
//     try {
//       expiring30 = await Product.find({
//         warrantyExpiryDate: dateRange(target30),
//         reminder30Sent: false,
//         warrantyStatus: { $ne: "expired" },
//       }).lean().exec();
      
//       scannedProducts.thirtyDay = expiring30.length;
//       scannedProducts.total += expiring30.length;
      
//       console.log('[WarrantyCheck] 📊 30-DAY SCAN RESULTS:');
//       console.log('[WarrantyCheck]   └─ 🔢 TOTAL PRODUCTS FOUND: ' + expiring30.length);
      
//       if (expiring30.length > 0) {
//         console.log('[WarrantyCheck]   └─ 📋 PRODUCT LIST:');
//         expiring30.forEach((product, index) => {
//           console.log(`[WarrantyCheck]       ${index + 1}. ID: ${product._id} | Name: ${product.productName || 'N/A'} | User: ${product.userId || 'N/A'} | Expiry: ${product.warrantyExpiryDate ? new Date(product.warrantyExpiryDate).toISOString() : 'N/A'}`);
//         });
//         console.log('[WarrantyCheck]   └─ ✅ Found ' + expiring30.length + ' products for 30-day reminders');
//       } else {
//         console.log('[WarrantyCheck]   └─ ⚠️ No products found for 30-day reminders');
//       }
//     } catch (queryError) {
//       console.error('[WarrantyCheck] ❌ ERROR: Failed to scan 30-day products:', {
//         error: queryError instanceof Error ? queryError.message : queryError,
//         stack: queryError instanceof Error ? queryError.stack : undefined,
//         targetDate: target30.toISOString()
//       });
//       throw queryError;
//     }

//     // ============= 7-DAY SCAN =============
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] 🔍 SCANNING FOR 7-DAY EXPIRATIONS');
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] Query criteria:', {
//       warrantyExpiryDate: {
//         $gte: dateRange(target7).$gte.toISOString(),
//         $lte: dateRange(target7).$lte.toISOString()
//       },
//       reminder7Sent: false,
//       warrantyStatus: { $ne: "expired" }
//     });

//     let expiring7 = [];
//     try {
//       expiring7 = await Product.find({
//         warrantyExpiryDate: dateRange(target7),
//         reminder7Sent: false,
//         warrantyStatus: { $ne: "expired" },
//       }).lean().exec();
      
//       scannedProducts.sevenDay = expiring7.length;
//       scannedProducts.total += expiring7.length;
      
//       console.log('[WarrantyCheck] 📊 7-DAY SCAN RESULTS:');
//       console.log('[WarrantyCheck]   └─ 🔢 TOTAL PRODUCTS FOUND: ' + expiring7.length);
      
//       if (expiring7.length > 0) {
//         console.log('[WarrantyCheck]   └─ 📋 PRODUCT LIST:');
//         expiring7.forEach((product, index) => {
//           console.log(`[WarrantyCheck]       ${index + 1}. ID: ${product._id} | Name: ${product.productName || 'N/A'} | User: ${product.userId || 'N/A'} | Expiry: ${product.warrantyExpiryDate ? new Date(product.warrantyExpiryDate).toISOString() : 'N/A'}`);
//         });
//         console.log('[WarrantyCheck]   └─ ✅ Found ' + expiring7.length + ' products for 7-day reminders');
//       } else {
//         console.log('[WarrantyCheck]   └─ ⚠️ No products found for 7-day reminders');
//       }
//     } catch (queryError) {
//       console.error('[WarrantyCheck] ❌ ERROR: Failed to scan 7-day products:', {
//         error: queryError instanceof Error ? queryError.message : queryError,
//         stack: queryError instanceof Error ? queryError.stack : undefined,
//         targetDate: target7.toISOString()
//       });
//       throw queryError;
//     }

//     checked = expiring30.length + expiring7.length;
    
//     // ============= SCAN SUMMARY =============
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] 📊 MASTER SCAN SUMMARY');
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck]   ├─ 🔢 TOTAL PRODUCTS SCANNED: ' + scannedProducts.total);
//     console.log('[WarrantyCheck]   ├─ 📅 30-day products: ' + scannedProducts.thirtyDay);
//     console.log('[WarrantyCheck]   ├─ 📅 7-day products: ' + scannedProducts.sevenDay);
//     console.log('[WarrantyCheck]   ├─ ✅ Products to process: ' + checked);
//     console.log('[WarrantyCheck]   └─ ⏱️  Scan completed in ' + (Date.now() - functionStartTime) + 'ms');
//     console.log('[WarrantyCheck] ==================================');

//     // ============= PROCESS 30-DAY REMINDERS =============
//     if (expiring30.length > 0) {
//       console.log('[WarrantyCheck] 🚀 STARTING 30-DAY REMINDER PROCESSING');
//       console.log('[WarrantyCheck]   └─ 🔢 Products to process: ' + expiring30.length);
//       console.log('[WarrantyCheck] ==================================');
      
//       for (let i = 0; i < expiring30.length; i++) {
//         const product = expiring30[i];
//         const productLogPrefix = `[WarrantyCheck:30d][Product:${product._id}]`;
//         scannedProducts.processed.thirtyDay++;
        
//         console.log(`${productLogPrefix} ==================================`);
//         console.log(`${productLogPrefix} 🔄 PROCESSING PRODUCT ${i + 1} OF ${expiring30.length}`);
//         console.log(`${productLogPrefix} 📊 Progress: ${i + 1}/${expiring30.length} (${Math.round(((i + 1)/expiring30.length)*100)}%)`);
//         console.log(`${productLogPrefix} └─ 📦 Product details from scan:`);
//         console.log(`${productLogPrefix}     ├─ ID: ${product._id}`);
//         console.log(`${productLogPrefix}     ├─ Name: ${product.productName}`);
//         console.log(`${productLogPrefix}     ├─ User ID: ${product.userId}`);
//         console.log(`${productLogPrefix}     ├─ Expiry Date: ${product.warrantyExpiryDate ? new Date(product.warrantyExpiryDate).toISOString() : 'N/A'}`);
//         console.log(`${productLogPrefix}     └─ reminder30Sent: ${product.reminder30Sent}`);
        
//         try {
//           // Fetch push subscriptions
//           console.log(`${productLogPrefix} 👤 Fetching push subscriptions for user: ${product.userId}`);
//           let subscriptions = [];
//           try {
//             subscriptions = await PushSubscription.find({ userId: product.userId }).lean().exec();
//             console.log(`${productLogPrefix} 📱 Found ${subscriptions.length} push subscriptions`);
            
//             if (subscriptions.length > 0) {
//               subscriptions.forEach((sub, idx) => {
//                 console.log(`${productLogPrefix}     Subscription ${idx + 1}: ID: ${sub._id} | User: ${sub.userId}`);
//               });
//             }
//           } catch (subError) {
//             console.error(`${productLogPrefix} ❌ Error fetching push subscriptions:`, {
//               error: subError instanceof Error ? subError.message : subError,
//               userId: product.userId
//             });
//             throw subError;
//           }

//           if (subscriptions.length === 0) {
//             console.log(`${productLogPrefix} ⚠️ No push subscriptions found - marking as sent`);
//             try {
//               await Product.findByIdAndUpdate(product._id, { 
//                 reminder30Sent: true,
//                 lastReminderCheck: new Date(),
//                 lastReminderReason: 'no_subscriptions'
//               });
//               console.log(`${productLogPrefix} ✅ Product marked as sent (no subscriptions)`);
//             } catch (updateError) {
//               console.error(`${productLogPrefix} ❌ Error updating product:`, updateError);
//               throw updateError;
//             }
//             continue;
//           }

//           const payload = {
//             title: "Warranty Expiring Soon ⏰",
//             body: `Your ${product.productName} warranty expires in 30 days.`,
//             url: `/product/${product._id}`,
//             tag: `warranty-30-${product._id}`,
//           };

//           console.log(`${productLogPrefix} 📨 Push payload prepared`);

//           let sent = false;
//           let successfulSends = 0;
//           let failedSends = 0;

//           for (let j = 0; j < subscriptions.length; j++) {
//             const sub = subscriptions[j];
//             try {
//               console.log(`${productLogPrefix} 📤 Sending push ${j + 1}/${subscriptions.length}`);
//               const ok = await sendPush(sub, payload);
//               if (ok) {
//                 sent = true;
//                 successfulSends++;
//                 console.log(`${productLogPrefix} ✅ Push ${j + 1} sent successfully`);
//               } else {
//                 failedSends++;
//                 console.warn(`${productLogPrefix} ⚠️ Push ${j + 1} failed`);
//               }
//             } catch (pushError) {
//               failedSends++;
//               console.error(`${productLogPrefix} ❌ Error sending push ${j + 1}:`, pushError);
//             }
//           }

//           console.log(`${productLogPrefix} 📊 Push summary: ${successfulSends} sent, ${failedSends} failed`);

//           if (sent) {
//             notified++;
//             console.log(`${productLogPrefix} 🎯 Notification marked as sent (total notified: ${notified})`);
//           }

//           try {
//             await Product.findByIdAndUpdate(product._id, { 
//               reminder30Sent: true,
//               lastReminderCheck: new Date(),
//               lastReminderResult: sent ? 'sent' : 'failed',
//               lastReminderDetails: {
//                 successfulSends,
//                 failedSends,
//                 totalSubscriptions: subscriptions.length,
//                 timestamp: new Date()
//               }
//             });
//             console.log(`${productLogPrefix} 💾 Product updated in database`);
//           } catch (updateError) {
//             console.error(`${productLogPrefix} ❌ Error updating product:`, updateError);
//             throw updateError;
//           }

//         } catch (err) {
//           errors++;
//           console.error(`${productLogPrefix} ❌❌❌ FATAL ERROR:`, {
//             error: err instanceof Error ? err.message : err,
//             product: product._id
//           });
//         }
        
//         // Show overall progress after each product
//         console.log(`${productLogPrefix} 📊 30-DAY PROCESSING PROGRESS: ${scannedProducts.processed.thirtyDay}/${expiring30.length} complete`);
//         console.log(`${productLogPrefix} ==================================`);
//       }
      
//       console.log('[WarrantyCheck] ✅ 30-DAY PROCESSING COMPLETED');
//       console.log('[WarrantyCheck]   ├─ Processed: ' + scannedProducts.processed.thirtyDay + '/' + expiring30.length);
//       console.log('[WarrantyCheck]   └─ Notifications sent: ' + notified + ' (cumulative)');
//     } else {
//       console.log('[WarrantyCheck] ⏭️  SKIPPING: No 30-day products to process');
//     }

//     // ============= PROCESS 7-DAY REMINDERS =============
//     if (expiring7.length > 0) {
//       console.log('[WarrantyCheck] ==================================');
//       console.log('[WarrantyCheck] 🚀 STARTING 7-DAY REMINDER PROCESSING');
//       console.log('[WarrantyCheck]   └─ 🔢 Products to process: ' + expiring7.length);
//       console.log('[WarrantyCheck] ==================================');
      
//       for (let i = 0; i < expiring7.length; i++) {
//         const product = expiring7[i];
//         const productLogPrefix = `[WarrantyCheck:7d][Product:${product._id}]`;
//         scannedProducts.processed.sevenDay++;
        
//         console.log(`${productLogPrefix} ==================================`);
//         console.log(`${productLogPrefix} 🔄 PROCESSING PRODUCT ${i + 1} OF ${expiring7.length}`);
//         console.log(`${productLogPrefix} 📊 Progress: ${i + 1}/${expiring7.length} (${Math.round(((i + 1)/expiring7.length)*100)}%)`);
//         console.log(`${productLogPrefix} └─ 📦 Product details from scan:`);
//         console.log(`${productLogPrefix}     ├─ ID: ${product._id}`);
//         console.log(`${productLogPrefix}     ├─ Name: ${product.productName}`);
//         console.log(`${productLogPrefix}     ├─ User ID: ${product.userId}`);
//         console.log(`${productLogPrefix}     ├─ Expiry Date: ${product.warrantyExpiryDate ? new Date(product.warrantyExpiryDate).toISOString() : 'N/A'}`);
//         console.log(`${productLogPrefix}     └─ reminder7Sent: ${product.reminder7Sent}`);
        
//         try {
//           console.log(`${productLogPrefix} 👤 Fetching push subscriptions for user: ${product.userId}`);
//           let subscriptions = [];
//           try {
//             subscriptions = await PushSubscription.find({ userId: product.userId }).lean().exec();
//             console.log(`${productLogPrefix} 📱 Found ${subscriptions.length} push subscriptions`);
            
//             if (subscriptions.length > 0) {
//               subscriptions.forEach((sub, idx) => {
//                 console.log(`${productLogPrefix}     Subscription ${idx + 1}: ID: ${sub._id} | User: ${sub.userId}`);
//               });
//             }
//           } catch (subError) {
//             console.error(`${productLogPrefix} ❌ Error fetching push subscriptions:`, {
//               error: subError instanceof Error ? subError.message : subError,
//               userId: product.userId
//             });
//             throw subError;
//           }

//           if (subscriptions.length === 0) {
//             console.log(`${productLogPrefix} ⚠️ No push subscriptions found - marking as sent`);
//             try {
//               await Product.findByIdAndUpdate(product._id, { 
//                 reminder7Sent: true,
//                 lastReminderCheck: new Date(),
//                 lastReminderReason: 'no_subscriptions'
//               });
//               console.log(`${productLogPrefix} ✅ Product marked as sent (no subscriptions)`);
//             } catch (updateError) {
//               console.error(`${productLogPrefix} ❌ Error updating product:`, updateError);
//               throw updateError;
//             }
//             continue;
//           }

//           const payload = {
//             title: "Warranty Expires in 7 Days 🚨",
//             body: `Your ${product.productName} warranty expires in 7 days. Act now!`,
//             url: `/product/${product._id}`,
//             tag: `warranty-7-${product._id}`,
//           };

//           console.log(`${productLogPrefix} 📨 Push payload prepared`);

//           let sent = false;
//           let successfulSends = 0;
//           let failedSends = 0;

//           for (let j = 0; j < subscriptions.length; j++) {
//             const sub = subscriptions[j];
//             try {
//               console.log(`${productLogPrefix} 📤 Sending push ${j + 1}/${subscriptions.length}`);
//               const ok = await sendPush(sub, payload);
//               if (ok) {
//                 sent = true;
//                 successfulSends++;
//                 console.log(`${productLogPrefix} ✅ Push ${j + 1} sent successfully`);
//               } else {
//                 failedSends++;
//                 console.warn(`${productLogPrefix} ⚠️ Push ${j + 1} failed`);
//               }
//             } catch (pushError) {
//               failedSends++;
//               console.error(`${productLogPrefix} ❌ Error sending push ${j + 1}:`, pushError);
//             }
//           }

//           console.log(`${productLogPrefix} 📊 Push summary: ${successfulSends} sent, ${failedSends} failed`);

//           if (sent) {
//             notified++;
//             console.log(`${productLogPrefix} 🎯 Notification marked as sent (total notified: ${notified})`);
//           }

//           try {
//             await Product.findByIdAndUpdate(product._id, { 
//               reminder7Sent: true,
//               lastReminderCheck: new Date(),
//               lastReminderResult: sent ? 'sent' : 'failed',
//               lastReminderDetails: {
//                 successfulSends,
//                 failedSends,
//                 totalSubscriptions: subscriptions.length,
//                 timestamp: new Date()
//               }
//             });
//             console.log(`${productLogPrefix} 💾 Product updated in database`);
//           } catch (updateError) {
//             console.error(`${productLogPrefix} ❌ Error updating product:`, updateError);
//             throw updateError;
//           }

//         } catch (err) {
//           errors++;
//           console.error(`${productLogPrefix} ❌❌❌ FATAL ERROR:`, {
//             error: err instanceof Error ? err.message : err,
//             product: product._id
//           });
//         }
        
//         // Show overall progress after each product
//         console.log(`${productLogPrefix} 📊 7-DAY PROCESSING PROGRESS: ${scannedProducts.processed.sevenDay}/${expiring7.length} complete`);
//         console.log(`${productLogPrefix} ==================================`);
//       }
      
//       console.log('[WarrantyCheck] ✅ 7-DAY PROCESSING COMPLETED');
//       console.log('[WarrantyCheck]   ├─ Processed: ' + scannedProducts.processed.sevenDay + '/' + expiring7.length);
//       console.log('[WarrantyCheck]   └─ Notifications sent: ' + notified + ' (cumulative)');
//     } else {
//       console.log('[WarrantyCheck] ⏭️  SKIPPING: No 7-day products to process');
//     }

//     const totalTime = Date.now() - functionStartTime;
    
//     // ============= FINAL SUMMARY =============
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] 📊 FINAL WARRANTY CHECK SUMMARY');
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck]   ├─ 🔢 TOTAL PRODUCTS SCANNED: ' + scannedProducts.total);
//     console.log('[WarrantyCheck]   ├─ 📅 30-day products found: ' + scannedProducts.thirtyDay);
//     console.log('[WarrantyCheck]   ├─ 📅 7-day products found: ' + scannedProducts.sevenDay);
//     console.log('[WarrantyCheck]   ├─ 🔄 PRODUCTS PROCESSED:');
//     console.log('[WarrantyCheck]   │    ├─ 30-day processed: ' + scannedProducts.processed.thirtyDay + '/' + scannedProducts.thirtyDay);
//     console.log('[WarrantyCheck]   │    └─ 7-day processed: ' + scannedProducts.processed.sevenDay + '/' + scannedProducts.sevenDay);
//     console.log('[WarrantyCheck]   ├─ 📨 NOTIFICATIONS SENT: ' + notified);
//     console.log('[WarrantyCheck]   ├─ ❌ ERRORS ENCOUNTERED: ' + errors);
//     console.log('[WarrantyCheck]   ├─ ✅ CHECKED COUNT: ' + checked);
//     console.log('[WarrantyCheck]   └─ ⏱️  TOTAL EXECUTION TIME: ' + totalTime + 'ms');
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] ' + (errors === 0 ? '✅ ALL OPERATIONS COMPLETED SUCCESSFULLY' : `⚠️ COMPLETED WITH ${errors} ERRORS`));
//     console.log('[WarrantyCheck] ==================================');

//     return { checked, notified, errors };

//   } catch (error) {
//     const totalTime = Date.now() - functionStartTime;
//     console.error('[WarrantyCheck] ==================================');
//     console.error('[WarrantyCheck] ❌❌❌ FATAL ERROR');
//     console.error('[WarrantyCheck] ==================================');
//     console.error('[WarrantyCheck] Error:', {
//       message: error instanceof Error ? error.message : error,
//       stack: error instanceof Error ? error.stack : undefined,
//       timeElapsed: totalTime + 'ms',
//       productsScanned: scannedProducts.total,
//       productsProcessed: scannedProducts.processed.thirtyDay + scannedProducts.processed.sevenDay,
//       notificationsSent: notified,
//       errorsEncountered: errors
//     });
//     console.error('[WarrantyCheck] ==================================');
    
//     throw error;
//   }
// }


// export async function checkWarrantyExpirations(): Promise<{
//   checked: number;
//   notified: number;
//   errors: number;
// }> {
//   const functionStartTime = Date.now();
//   console.log('[WarrantyCheck] ==================================');
//   console.log('[WarrantyCheck] 🔍 STARTING WARRANTY EXPIRATION CHECK');
//   console.log('[WarrantyCheck] ==================================');
  
//   let checked = 0;
//   let notified = 0;
//   let errors = 0;
//   let scannedProducts = {
//     total: 0,
//     thirtyDay: 0,
//     sevenDay: 0,
//     processed: {
//       thirtyDay: 0,
//       sevenDay: 0
//     }
//   };

//   try {
//     // Check database connection and current database
//     console.log('[WarrantyCheck] 🔌 Checking database connection...');
//     const connection = await connectToDatabase();
    
//     // Get current database info
//     const adminDb = connection.connection.db.admin();
//     const dbInfo = await adminDb.listDatabases();
    
//     console.log('[WarrantyCheck] 📊 AVAILABLE DATABASES:');
//     dbInfo.databases.forEach((db: any) => {
//       console.log(`[WarrantyCheck]   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
//     });

//     // Get current database name
//     const currentDbName = connection.connection.db.databaseName;
//     console.log('[WarrantyCheck] 🎯 CURRENT DATABASE:');
//     console.log(`[WarrantyCheck]   └─ ${currentDbName}`);

//     // Check if we're in the right database
//     if (currentDbName !== 'test') {
//       console.log(`[WarrantyCheck] ⚠️ WARNING: Connected to database "${currentDbName}", but expected "test"`);
      
//       // Try to switch to test database
//       console.log('[WarrantyCheck] 🔄 Attempting to switch to "test" database...');
//       connection.connection.db = connection.connection.client.db('test');
//       console.log('[WarrantyCheck] ✅ Switched to database: test');
//     }

//     // Check collections in current database
//     const collections = await connection.connection.db.listCollections().toArray();
//     console.log('[WarrantyCheck] 📚 COLLECTIONS IN CURRENT DATABASE:');
//     if (collections.length === 0) {
//       console.log('[WarrantyCheck]   └─ ❌ No collections found!');
//     } else {
//       collections.forEach(collection => {
//         console.log(`[WarrantyCheck]   - ${collection.name}`);
//       });
//     }

//     // Check if products collection exists
//     const productsCollectionExists = collections.some(c => c.name === 'products');
//     console.log('[WarrantyCheck] 🔍 PRODUCTS COLLECTION:');
//     console.log(`[WarrantyCheck]   └─ ${productsCollectionExists ? '✅ Found' : '❌ NOT FOUND'}`);

//     // Count all products in the collection (regardless of filters)
//     const totalProductsCount = await Product.countDocuments({});
//     console.log('[WarrantyCheck] 📊 TOTAL PRODUCTS IN COLLECTION:');
//     console.log(`[WarrantyCheck]   └─ ${totalProductsCount} documents`);

//     if (totalProductsCount > 0) {
//       // Sample a few products to see their structure
//       const sampleProducts = await Product.find({}).limit(3).lean();
//       console.log('[WarrantyCheck] 📋 SAMPLE PRODUCTS (first 3):');
//       sampleProducts.forEach((product, index) => {
//         console.log(`[WarrantyCheck]   Product ${index + 1}:`);
//         console.log(`[WarrantyCheck]     └─ ID: ${product._id}`);
//         console.log(`[WarrantyCheck]     └─ Name: ${product.productName || 'N/A'}`);
//         console.log(`[WarrantyCheck]     └─ warrantyExpiryDate: ${product.warrantyExpiryDate ? new Date(product.warrantyExpiryDate).toISOString() : 'NOT SET'}`);
//         console.log(`[WarrantyCheck]     └─ warrantyStatus: ${product.warrantyStatus || 'NOT SET'}`);
//         console.log(`[WarrantyCheck]     └─ reminder30Sent: ${product.reminder30Sent} (type: ${typeof product.reminder30Sent})`);
//         console.log(`[WarrantyCheck]     └─ reminder7Sent: ${product.reminder7Sent} (type: ${typeof product.reminder7Sent})`);
//       });
//     }

//     const target30 = daysFromNow(30);
//     const target7 = daysFromNow(7);

//     console.log('[WarrantyCheck] 📅 TARGET DATES:');
//     console.log(`[WarrantyCheck]   └─ 30-day target: ${target30.toISOString()}`);
//     console.log(`[WarrantyCheck]   └─ 7-day target: ${target7.toISOString()}`);

//     // Function to debug date range
//     function dateRange(target: Date) {
//       const start = new Date(target);
//       start.setUTCHours(0, 0, 0, 0);
//       const end = new Date(target);
//       end.setUTCHours(23, 59, 59, 999);
//       return { $gte: start, $lte: end };
//     }

//     // Test query without filters first
//     console.log('[WarrantyCheck] 🔍 TESTING QUERIES...');
    
//     // Test 1: Count all products with warrantyExpiryDate
//     const productsWithExpiryDate = await Product.countDocuments({
//       warrantyExpiryDate: { $exists: true }
//     });
//     console.log(`[WarrantyCheck]   ├─ Products with warrantyExpiryDate field: ${productsWithExpiryDate}`);

//     // Test 2: Check date ranges
//     console.log('[WarrantyCheck]   ├─ Checking date distributions...');
    
//     const allProducts = await Product.find({ warrantyExpiryDate: { $exists: true } })
//       .select('warrantyExpiryDate productName')
//       .lean();
    
//     allProducts.forEach(product => {
//       const date = new Date(product.warrantyExpiryDate);
//       const daysDiff = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
//       console.log(`[WarrantyCheck]   │  └─ Product: ${product.productName}, Expires: ${date.toISOString()} (in ${daysDiff} days)`);
//     });

//     // ============= 30-DAY SCAN =============
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] 🔍 SCANNING FOR 30-DAY EXPIRATIONS');
//     console.log('[WarrantyCheck] ==================================');
    
//     const range30 = dateRange(target30);
//     console.log('[WarrantyCheck] 30-day query range:', {
//       $gte: range30.$gte.toISOString(),
//       $lte: range30.$lte.toISOString()
//     });

//     // First, count how many products match just the date range
//     const dateOnlyCount30 = await Product.countDocuments({
//       warrantyExpiryDate: range30
//     });
//     console.log(`[WarrantyCheck]   ├─ Products matching date range only: ${dateOnlyCount30}`);

//     // Then count with reminder flag
//     const reminderFalseCount30 = await Product.countDocuments({
//       warrantyExpiryDate: range30,
//       reminder30Sent: false
//     });
//     console.log(`[WarrantyCheck]   ├─ Products with reminder30Sent=false: ${reminderFalseCount30}`);

//     // Finally with status filter
//     const statusFilterCount30 = await Product.countDocuments({
//       warrantyExpiryDate: range30,
//       reminder30Sent: false,
//       warrantyStatus: { $ne: "expired" }
//     });
//     console.log(`[WarrantyCheck]   └─ Products matching all filters: ${statusFilterCount30}`);

//     let expiring30 = [];
//     try {
//       expiring30 = await Product.find({
//         warrantyExpiryDate: range30,
//         reminder30Sent: false,
//         warrantyStatus: { $ne: "expired" },
//       }).lean().exec();
      
//       scannedProducts.thirtyDay = expiring30.length;
//       scannedProducts.total += expiring30.length;
      
//       console.log('[WarrantyCheck] 📊 30-DAY SCAN RESULTS:');
//       console.log('[WarrantyCheck]   └─ 🔢 TOTAL PRODUCTS FOUND: ' + expiring30.length);
      
//       if (expiring30.length > 0) {
//         console.log('[WarrantyCheck]   └─ 📋 PRODUCT LIST:');
//         expiring30.forEach((product, index) => {
//           console.log(`[WarrantyCheck]       ${index + 1}. ID: ${product._id} | Name: ${product.productName || 'N/A'} | Expiry: ${product.warrantyExpiryDate ? new Date(product.warrantyExpiryDate).toISOString() : 'N/A'}`);
//         });
//       }
//     } catch (queryError) {
//       console.error('[WarrantyCheck] ❌ ERROR: Failed to scan 30-day products:', queryError);
//       throw queryError;
//     }

//     // ============= 7-DAY SCAN =============
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] 🔍 SCANNING FOR 7-DAY EXPIRATIONS');
//     console.log('[WarrantyCheck] ==================================');
    
//     const range7 = dateRange(target7);
//     console.log('[WarrantyCheck] 7-day query range:', {
//       $gte: range7.$gte.toISOString(),
//       $lte: range7.$lte.toISOString()
//     });

//     // First, count how many products match just the date range
//     const dateOnlyCount7 = await Product.countDocuments({
//       warrantyExpiryDate: range7
//     });
//     console.log(`[WarrantyCheck]   ├─ Products matching date range only: ${dateOnlyCount7}`);

//     // Then count with reminder flag
//     const reminderFalseCount7 = await Product.countDocuments({
//       warrantyExpiryDate: range7,
//       reminder7Sent: false
//     });
//     console.log(`[WarrantyCheck]   ├─ Products with reminder7Sent=false: ${reminderFalseCount7}`);

//     // Finally with status filter
//     const statusFilterCount7 = await Product.countDocuments({
//       warrantyExpiryDate: range7,
//       reminder7Sent: false,
//       warrantyStatus: { $ne: "expired" }
//     });
//     console.log(`[WarrantyCheck]   └─ Products matching all filters: ${statusFilterCount7}`);

//     let expiring7 = [];
//     try {
//       expiring7 = await Product.find({
//         warrantyExpiryDate: range7,
//         reminder7Sent: false,
//         warrantyStatus: { $ne: "expired" },
//       }).lean().exec();
      
//       scannedProducts.sevenDay = expiring7.length;
//       scannedProducts.total += expiring7.length;
      
//       console.log('[WarrantyCheck] 📊 7-DAY SCAN RESULTS:');
//       console.log('[WarrantyCheck]   └─ 🔢 TOTAL PRODUCTS FOUND: ' + expiring7.length);
      
//       if (expiring7.length > 0) {
//         console.log('[WarrantyCheck]   └─ 📋 PRODUCT LIST:');
//         expiring7.forEach((product, index) => {
//           console.log(`[WarrantyCheck]       ${index + 1}. ID: ${product._id} | Name: ${product.productName || 'N/A'} | Expiry: ${product.warrantyExpiryDate ? new Date(product.warrantyExpiryDate).toISOString() : 'N/A'}`);
//         });
//       }
//     } catch (queryError) {
//       console.error('[WarrantyCheck] ❌ ERROR: Failed to scan 7-day products:', queryError);
//       throw queryError;
//     }

//     checked = expiring30.length + expiring7.length;
    
//     // ============= SCAN SUMMARY =============
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck] 📊 MASTER SCAN SUMMARY');
//     console.log('[WarrantyCheck] ==================================');
//     console.log('[WarrantyCheck]   ├─ 🔢 TOTAL PRODUCTS IN DB: ' + totalProductsCount);
//     console.log('[WarrantyCheck]   ├─ 📅 30-day products found: ' + scannedProducts.thirtyDay);
//     console.log('[WarrantyCheck]   ├─ 📅 7-day products found: ' + scannedProducts.sevenDay);
//     console.log('[WarrantyCheck]   ├─ ✅ Products to process: ' + checked);
//     console.log('[WarrantyCheck]   └─ ⏱️  Scan completed in ' + (Date.now() - functionStartTime) + 'ms');

//     // If no products found but totalProductsCount > 0, show warning
//     if (checked === 0 && totalProductsCount > 0) {
//       console.log('[WarrantyCheck] ⚠️⚠️⚠️ WARNING: No products matched the criteria!');
//       console.log('[WarrantyCheck]    Possible issues:');
//       console.log('[WarrantyCheck]    1. Date fields might be stored as strings instead of Date objects');
//       console.log('[WarrantyCheck]    2. Reminder flags might be set to true already');
//       console.log('[WarrantyCheck]    3. Warranty status might be "expired"');
//       console.log('[WarrantyCheck]    4. Date calculations might be off (check timezone)');
//     }

//     // ... rest of your processing code remains the same ...
    
//     return { checked, notified, errors };

//   } catch (error) {
//     const totalTime = Date.now() - functionStartTime;
//     console.error('[WarrantyCheck] ❌❌❌ FATAL ERROR:', error);
//     throw error;
//   }
// }
