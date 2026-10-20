process.env.SUPPRESS_AUTO_START = 'true';
process.env.NODE_ENV = 'test';

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import mockDataService from '../services/mockDataService.js';
import { startServer } from '../index.js';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('\n======================================================');
  console.log('    EcoCity Database-Free Backend Verification Suite   ');
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
    // 1. Check if server is already running, else start it
    try {
      const ping = await axios.get(`${BASE_URL}/api/health`, { timeout: 1000 });
      if (ping.status === 200) {
        console.log('[Setup] Server already active on port 5000 - connecting directly\n');
      }
    } catch {
      server = await startServer();
      console.log('[Setup] Server started in database-free mock mode on port 5000\n');
    }

    // 2. Health check
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    assert(
      healthRes.status === 200 && healthRes.data.status === 'healthy',
      '1. GET /api/health returns 200 and status: healthy'
    );
    assert(
      healthRes.data.database?.includes('database-free'),
      '2. Health response confirms database-free mock mode'
    );

    // 3. Test missing required fields on POST /api/reports
    try {
      await axios.post(`${BASE_URL}/api/reports`, {});
      assert(false, '3. POST /api/reports with empty body should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400,
        '3. POST /api/reports with empty body returns 400 Bad Request',
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
      assert(false, '4. POST /api/reports without photo should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400 && err.response.data.message.includes('photo'),
        '4. POST /api/reports without photo returns 400 required photo error'
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
      assert(false, '5. POST /api/reports with invalid email should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400 && err.response.data.message.includes('valid email'),
        '5. POST /api/reports with invalid email returns 400 valid email error'
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
      assert(false, '6. POST /api/reports with .txt should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 400 && err.response.data.message.includes('Only JPEG, PNG, and WebP'),
        '6. POST /api/reports with non-image file returns 400 invalid file type error'
      );
    }

    // 7. Test valid complaint submission with photo, GPS, description
    const sampleImgPath = path.resolve(process.cwd(), 'server/test/sample.png');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(sampleImgPath, pngBuffer);

    const validForm = new FormData();
    validForm.append('name', 'Citizen Reporter');
    validForm.append('email', 'citizen.test@ecocity.org');
    validForm.append('locationName', 'Main Market Intersection');
    validForm.append('latitude', '17.439920');
    validForm.append('longitude', '78.498271');
    validForm.append('title', 'Garbage Overflow near Metro Station');
    validForm.append('category', 'Garbage');
    validForm.append('description', 'Excessive domestic waste spilling onto pedestrian walkways.');
    validForm.append('photo', fs.createReadStream(sampleImgPath));

    const submitRes = await axios.post(`${BASE_URL}/api/reports`, validForm, {
      headers: validForm.getHeaders()
    });

    assert(submitRes.status === 201, '7. POST /api/reports returns 201 Created');
    assert(submitRes.data.success === true, '8. POST /api/reports response has success: true');
    assert(!!submitRes.data.data.complaintId, '9. Report has generated complaintId (ECO-...)');
    assert(submitRes.data.data.status === 'Pending', '10. Report initial status defaults to Pending');
    assert(submitRes.data.data.latitude === 17.43992, '11. GPS Latitude preserved accurately');
    assert(submitRes.data.data.longitude === 78.498271, '12. GPS Longitude preserved accurately');
    assert(!!submitRes.data.data.photoUrl, '13. Report has accessible photoUrl');
    assert(
      submitRes.data.emailNotification !== undefined,
      '14. Report response includes emailNotification status object'
    );
    console.log(`     [Brevo Integration Inspection] Email dispatched state: ${submitRes.data.emailNotification.sent}, Info/Error: ${submitRes.data.emailNotification.error || 'Accepted with ID: ' + submitRes.data.emailNotification.messageId}`);

    const createdComplaintId = submitRes.data.data.complaintId;
    const createdReportId = submitRes.data.data._id || submitRes.data.data.id;

    // 8. Verify report is persisted in mockDataService
    const verifyHttpReport = await axios.get(`${BASE_URL}/api/reports/${createdReportId}`);
    assert(!!verifyHttpReport.data?.data, '15. Report record exists in centralized in-memory mock-data store');
    assert(verifyHttpReport.data.data.email === 'citizen.test@ecocity.org', '16. Citizen email stored accurately in mock store');

    // 9. Test GET /api/reports/:id (Lookup single report)
    const singleRes = await axios.get(`${BASE_URL}/api/reports/${createdComplaintId}`);
    assert(
      singleRes.status === 200 && singleRes.data.data.complaintId === createdComplaintId,
      '17. GET /api/reports/:id retrieves specific complaint'
    );

    // 10. Test unauthorized access to GET /api/reports (Admin endpoint)
    try {
      await axios.get(`${BASE_URL}/api/reports`);
      assert(false, '18. Unauthorized GET /api/reports should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 401,
        '18. Unauthorized GET /api/reports blocked with 401 Unauthorized'
      );
    }

    // 11. Test unauthorized status update PATCH /api/reports/:id/status
    try {
      await axios.patch(`${BASE_URL}/api/reports/${createdReportId}/status`, { status: 'In Progress' });
      assert(false, '19. Unauthorized PATCH /api/reports/:id/status should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 401,
        '19. Unauthorized PATCH /api/reports/:id/status blocked with 401 Unauthorized'
      );
    }

    // 12. Test incorrect Admin credentials
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'likithamindi024@gmail.com',
        password: 'wrong_password_123'
      });
      assert(false, '20. Admin login with incorrect password should fail');
    } catch (err: any) {
      assert(
        err.response && err.response.status === 401,
        '20. Admin login with incorrect password returns 401 Unauthorized'
      );
    }

    // 13. Test successful Admin login with dummy credentials
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'likithamindi024@gmail.com',
      password: 'likitha123'
    });
    assert(
      loginRes.status === 200 && !!loginRes.data.token,
      '21. Admin login succeeds with likithamindi024@gmail.com / likitha123 and returns JWT'
    );
    const adminToken = loginRes.data.token;

    // 14. Test GET /api/auth/me session verification with JWT
    const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      meRes.status === 200 && meRes.data.user.email === 'likithamindi024@gmail.com',
      '22. GET /api/auth/me verifies admin session and returns profile'
    );

    // 15. Test authorized GET /api/reports using JWT
    const adminReportsRes = await axios.get(`${BASE_URL}/api/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminReportsRes.status === 200 && Array.isArray(adminReportsRes.data.data),
      '23. Authorized GET /api/reports returns 200 and reports list'
    );
    assert(
      adminReportsRes.data.data.some((r: any) => r.complaintId === createdComplaintId),
      '24. Newly submitted report appears in admin reports list'
    );

    // 16. Test authorized status update PATCH /api/reports/:id/status
    const patchRes = await axios.patch(
      `${BASE_URL}/api/reports/${createdReportId}/status`,
      { status: 'In Progress', notes: 'Sanitation unit dispatched to site' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(
      patchRes.status === 200 && patchRes.data.data.status === 'In Progress',
      '25. Authorized PATCH /api/reports/:id/status updates status to In Progress'
    );

    // 17. Verify status update in centralized mock store
    const verifyUpdatedReport = await axios.get(`${BASE_URL}/api/reports/${createdReportId}`);
    assert(
      verifyUpdatedReport.data.data.status === 'In Progress' &&
        verifyUpdatedReport.data.data.resolutionNotes === 'Sanitation unit dispatched to site',
      '26. Status update verified in centralized in-memory mock store'
    );

    // 18. Test public recent reports endpoint
    const publicRecentRes = await axios.get(`${BASE_URL}/api/reports/public/recent`);
    assert(
      publicRecentRes.status === 200 && Array.isArray(publicRecentRes.data.data),
      '27. GET /api/reports/public/recent returns sanitized list'
    );
    assert(
      publicRecentRes.data.data[0].email === undefined,
      '28. Public recent reports sanitize citizen personal email for privacy'
    );

  } catch (testError: any) {
    console.error('Test Suite Fatal Error:', testError);
    failedCount++;
  } finally {
    console.log('\n======================================================');
    console.log(`Test Results: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('======================================================\n');

    // Clean up test files
    try {
      const testDir = path.resolve(process.cwd(), 'server/test');
      ['sample.jpg', 'sample.txt', 'oversized.jpg', 'sample.png'].forEach((f) => {
        const p = path.join(testDir, f);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    } catch {
      // ignore
    }

    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      server.close();
      server.unref();
    }
    setTimeout(() => {
      process.exit(failedCount > 0 ? 1 : 0);
    }, 100);
  }
}

runTests();
