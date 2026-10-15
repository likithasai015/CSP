process.env.SUPPRESS_AUTO_START = 'true';
process.env.NODE_ENV = 'test';

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import Report from '../models/Report';
import Admin from '../models/Admin';
import { startServer } from '../index';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('\n======================================================');
  console.log('       EcoCity Backend Verification Test Suite        ');
  console.log('======================================================\n');

  let server: any;
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failedCount++;
    }
  }

  try {
    // 1. Connect to DB and check if server is already running
    await connectDB();
    try {
      const ping = await axios.get(`${BASE_URL}/api/health`, { timeout: 1000 });
      if (ping.status === 200) {
        console.log('[Setup] Server already running on port 5000 - connecting directly\n');
      }
    } catch {
      server = await startServer();
      console.log('[Setup] Server started for testing on port 5000\n');
    }

    // 2. Health check
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200 && healthRes.data.status === 'healthy', '1. GET /api/health returns healthy');

    // 3. Test missing required fields on POST /api/reports
    try {
      await axios.post(`${BASE_URL}/api/reports`, {});
      assert(false, '2. POST /api/reports with empty body should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400,
        '2. POST /api/reports with empty body returns 400 Bad Request',
        err.response?.data?.message
      );
    }

    // 4. Test missing photo
    try {
      const formNoPhoto = new FormData();
      formNoPhoto.append('name', 'John Doe');
      formNoPhoto.append('email', 'john@example.com');
      formNoPhoto.append('locationName', 'Central Park');
      await axios.post(`${BASE_URL}/api/reports`, formNoPhoto, {
        headers: formNoPhoto.getHeaders()
      });
      assert(false, '3. POST /api/reports without photo should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400 && err.response.data.message.includes('photo'),
        '3. POST /api/reports without photo returns 400 required photo error'
      );
    }

    // 5. Test invalid email
    try {
      const formBadEmail = new FormData();
      formBadEmail.append('name', 'John Doe');
      formBadEmail.append('email', 'not-an-email');
      formBadEmail.append('locationName', 'Central Park');
      const dummyImgPath = path.resolve(process.cwd(), 'server/test/sample.jpg');
      fs.writeFileSync(dummyImgPath, Buffer.from('fake image content'));
      formBadEmail.append('photo', fs.createReadStream(dummyImgPath));
      await axios.post(`${BASE_URL}/api/reports`, formBadEmail, {
        headers: formBadEmail.getHeaders()
      });
      assert(false, '4. POST /api/reports with invalid email should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400 && err.response.data.message.includes('valid email'),
        '4. POST /api/reports with invalid email returns 400 valid email error'
      );
    }

    // 6. Test unsupported file type (.txt)
    try {
      const formBadExt = new FormData();
      formBadExt.append('name', 'John Doe');
      formBadExt.append('email', 'john@example.com');
      formBadExt.append('locationName', 'Central Park');
      const badTxtPath = path.resolve(process.cwd(), 'server/test/sample.txt');
      fs.writeFileSync(badTxtPath, 'this is text, not an image');
      formBadExt.append('photo', fs.createReadStream(badTxtPath));
      await axios.post(`${BASE_URL}/api/reports`, formBadExt, {
        headers: formBadExt.getHeaders()
      });
      assert(false, '5. POST /api/reports with .txt should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400 && err.response.data.message.includes('Only JPEG, PNG, and WebP'),
        '5. POST /api/reports with non-image file returns 400 invalid file type error'
      );
    }

    // 7. Test oversized file (> 5 MB)
    try {
      const formOversized = new FormData();
      formOversized.append('name', 'John Doe');
      formOversized.append('email', 'john@example.com');
      formOversized.append('locationName', 'Central Park');
      const oversizedPath = path.resolve(process.cwd(), 'server/test/oversized.jpg');
      // Create a dummy 5.5 MB file
      const bigBuffer = Buffer.alloc(5.5 * 1024 * 1024);
      fs.writeFileSync(oversizedPath, bigBuffer);
      formOversized.append('photo', fs.createReadStream(oversizedPath));
      await axios.post(`${BASE_URL}/api/reports`, formOversized, {
        headers: formOversized.getHeaders()
      });
      assert(false, '6. POST /api/reports with >5MB image should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400 && err.response.data.message.includes('5 MB'),
        '6. POST /api/reports with >5MB image returns 400 file size limit error'
      );
    }

    // 8. Test valid complaint submission with photo, GPS, description
    const sampleImgPath = path.resolve(process.cwd(), 'server/test/sample.png');
    // Simple 1x1 PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(sampleImgPath, pngBuffer);

    const validForm = new FormData();
    validForm.append('name', 'Citizen Rushitha');
    validForm.append('email', 'rushitha@ecocity.org');
    validForm.append('locationName', 'Main Street Corner, Block 4');
    validForm.append('latitude', '17.439920');
    validForm.append('longitude', '78.498271');
    validForm.append('description', 'Large garbage pile left uncollected for three days near sidewalk');
    validForm.append('photo', fs.createReadStream(sampleImgPath));

    const submitRes = await axios.post(`${BASE_URL}/api/reports`, validForm, {
      headers: validForm.getHeaders()
    });

    assert(submitRes.status === 201, '7. POST /api/reports returns 201 Created');
    assert(submitRes.data.success === true, '8. POST /api/reports response has success: true');
    assert(!!submitRes.data.data.complaintId, '9. Complaint has generated complaintId (e.g. ECO-...)');
    assert(submitRes.data.data.status === 'Pending', '10. Complaint initial status defaults to Pending');
    assert(submitRes.data.data.latitude === 17.43992, '11. GPS Latitude preserved accurately');
    assert(submitRes.data.data.longitude === 78.498271, '12. GPS Longitude preserved accurately');
    assert(!!submitRes.data.data.photoUrl, '13. Complaint has accessible photoUrl');
    assert(
      submitRes.data.emailNotification !== undefined,
      '14. Complaint response includes emailNotification status object'
    );

    const createdComplaintId = submitRes.data.data.complaintId;
    const createdMongoId = submitRes.data.data._id;

    // 9. Verify complaint is in MongoDB
    const dbReport = await Report.findById(createdMongoId);
    assert(!!dbReport, '15. Complaint record exists and is persisted in MongoDB');
    assert(dbReport?.email === 'rushitha@ecocity.org', '16. Citizen email stored correctly in MongoDB');

    // 10. Test GET /api/reports/:id (Public / single lookup)
    const singleRes = await axios.get(`${BASE_URL}/api/reports/${createdComplaintId}`);
    assert(singleRes.status === 200 && singleRes.data.data.complaintId === createdComplaintId, '17. GET /api/reports/:id retrieves specific complaint');

    // 11. Test unauthorized access to GET /api/reports (Admin endpoint)
    try {
      await axios.get(`${BASE_URL}/api/reports`);
      assert(false, '18. Unauthorized GET /api/reports should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 401,
        '18. Unauthorized GET /api/reports is blocked with 401 Unauthorized'
      );
    }

    // 12. Test unauthorized status update PATCH /api/reports/:id/status
    try {
      await axios.patch(`${BASE_URL}/api/reports/${createdMongoId}/status`, { status: 'In Progress' });
      assert(false, '19. Unauthorized PATCH /api/reports/:id/status should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 401,
        '19. Unauthorized PATCH /api/reports/:id/status is blocked with 401 Unauthorized'
      );
    }

    // 13. Test Admin Login POST /api/auth/login
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@ecocity.com',
      password: 'Admin@123'
    });
    assert(loginRes.status === 200 && !!loginRes.data.token, '20. POST /api/auth/login succeeds and returns JWT token');
    const adminToken = loginRes.data.token;

    // 14. Test authorized access to GET /api/reports using JWT
    const adminReportsRes = await axios.get(`${BASE_URL}/api/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminReportsRes.status === 200 && Array.isArray(adminReportsRes.data.data),
      '21. Authorized GET /api/reports returns 200 and complaints list'
    );
    assert(
      adminReportsRes.data.data.some((r: any) => r.complaintId === createdComplaintId),
      '22. Submitted complaint appears in admin complaints list'
    );

    // 15. Test authorized status update PATCH /api/reports/:id/status
    const patchRes = await axios.patch(
      `${BASE_URL}/api/reports/${createdMongoId}/status`,
      { status: 'In Progress', notes: 'Sanitation team dispatched' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(
      patchRes.status === 200 && patchRes.data.data.status === 'In Progress',
      '23. Authorized PATCH /api/reports/:id/status updates status to In Progress'
    );

    // 16. Verify status update in MongoDB
    const updatedDbReport = await Report.findById(createdMongoId);
    assert(
      updatedDbReport?.status === 'In Progress' && updatedDbReport?.resolutionNotes === 'Sanitation team dispatched',
      '24. Updated status and notes verified in MongoDB'
    );

    // 17. Test public recent reports endpoint
    const publicRecentRes = await axios.get(`${BASE_URL}/api/reports/public/recent`);
    assert(
      publicRecentRes.status === 200 && Array.isArray(publicRecentRes.data.data),
      '25. GET /api/reports/public/recent returns sanitized list'
    );
    assert(
      publicRecentRes.data.data[0].email === undefined,
      '26. Public recent reports sanitize citizen email for privacy'
    );

  } catch (testError: any) {
    console.error('Test Suite Fatal Error:', testError);
    failedCount++;
  } finally {
    console.log('\n======================================================');
    console.log(`Test Results: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('======================================================\n');

    // Clean up temporary test files
    try {
      const testDir = path.resolve(process.cwd(), 'server/test');
      ['sample.jpg', 'sample.txt', 'oversized.jpg', 'sample.png'].forEach((f) => {
        const p = path.join(testDir, f);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    } catch (e) {
      // ignore
    }

    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
