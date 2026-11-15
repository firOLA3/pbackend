import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Notification } from '../models/notification.model.js';
import { generateAccessToken } from '../utils/jwt.js';

async function testNotificationsFlow() {
  console.log('=== STARTING NOTIFICATIONS FLOW TEST ===\n');

  await connectDB();

  const testEmail = `test_notif_${Date.now()}@example.com`;
  const user = await User.create({
    email: testEmail,
    name: 'Notification Tester',
    passwordHash: 'dummyhash123',
    isEmailVerified: true,
  });
  console.log(`1. Created test user: ${user._id} (${user.email})`);

  const token = generateAccessToken({ userId: user._id.toString(), email: user.email });
  const baseUrl = 'http://localhost:5000/api/notifications';

  // 2. Fetch Notifications (triggers auto-seeding)
  const getRes = await fetch(baseUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getData: any = await getRes.json();
  console.log(`2. GET /api/notifications status: ${getRes.status}, count: ${getData.data?.length}, unread: ${getData.unreadCount}`);
  if (getData.data?.length !== 6 || getData.unreadCount !== 2) {
    throw new Error(`Expected 6 notifications with 2 unread, got count=${getData.data?.length}, unread=${getData.unreadCount}`);
  }

  // 3. Mark All Read
  const markRes = await fetch(`${baseUrl}/mark-all-read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  const markData: any = await markRes.json();
  console.log(`3. PUT /api/notifications/mark-all-read status: ${markRes.status}, success: ${markData.success}`);

  // 4. Verify unread count is 0
  const verifyRes = await fetch(baseUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifyData: any = await verifyRes.json();
  console.log(`4. Verify unreadCount after markAllRead: ${verifyData.unreadCount}`);
  if (verifyData.unreadCount !== 0) {
    throw new Error(`Expected unreadCount=0, got ${verifyData.unreadCount}`);
  }

  // 5. Delete one notification
  const firstId = verifyData.data[0]._id;
  const delRes = await fetch(`${baseUrl}/${firstId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const delData: any = await delRes.json();
  console.log(`5. DELETE /api/notifications/${firstId} status: ${delRes.status}, success: ${delData.success}`);

  // 6. Verify count is now 5
  const countAfter = await Notification.countDocuments({ userId: user._id });
  console.log(`6. Remaining notifications in DB: ${countAfter}`);
  if (countAfter !== 5) {
    throw new Error(`Expected 5 notifications, got ${countAfter}`);
  }

  // Cleanup test user and notifications
  await Notification.deleteMany({ userId: user._id });
  await User.deleteOne({ _id: user._id });
  console.log('\n7. Cleaned up test user & notifications');

  await mongoose.disconnect();
  console.log('\n✅ ALL NOTIFICATIONS TESTS PASSED SUCCESSFULLY!');
}

testNotificationsFlow().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
