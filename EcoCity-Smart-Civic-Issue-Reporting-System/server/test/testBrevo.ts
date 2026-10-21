import { BrevoService } from '../services/brevoService.js';
import type { IReportData } from '../services/mockDataService.js';

async function runBrevoUnitTests() {
  console.log('\n======================================================');
  console.log('       Brevo Service Unit & Diagnostic Tests          ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Check default admin & sender fallback
  const adminEmail = BrevoService.getAdminEmail();
  assert(
    adminEmail === 'likithamindi024@gmail.com',
    '1. getAdminEmail defaults to likithamindi024@gmail.com',
    `Got: ${adminEmail}`
  );

  const senderEmail = BrevoService.getSenderEmail();
  assert(
    senderEmail === 'likithamindi024@gmail.com',
    '2. getSenderEmail defaults to likithamindi024@gmail.com',
    `Got: ${senderEmail}`
  );

  const senderName = BrevoService.getSenderName();
  assert(
    senderName === 'EcoCity Civic System',
    '3. getSenderName defaults to EcoCity Civic System',
    `Got: ${senderName}`
  );

  // 2. Test HTML generation with Data URI photo
  const dummyReportWithDataUri: IReportData = {
    _id: 'test-123',
    id: 'test-123',
    complaintId: 'ECO-999999-1234',
    name: 'Citizen Jane',
    email: 'jane@example.com',
    locationName: 'MG Road, Landmark Bank',
    latitude: 12.9716,
    longitude: 77.5946,
    description: 'Pothole on the left lane causing traffic hazard.',
    title: 'Severe Pothole on MG Road',
    category: 'Potholes',
    department: 'Public Works Department',
    photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
    status: 'Pending',
    priority: 'High',
    emailNotification: { sent: false },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const htmlDataUri = BrevoService.generateComplaintEmailHtml(dummyReportWithDataUri);

  assert(
    htmlDataUri.includes('ECO-999999-1234'),
    '4. HTML contains report Complaint ID'
  );
  assert(
    htmlDataUri.includes('MG Road, Landmark Bank'),
    '5. HTML contains incident location'
  );
  assert(
    htmlDataUri.includes('Citizen Jane'),
    '6. HTML contains citizen name'
  );
  assert(
    htmlDataUri.includes('Public Works Department'),
    '7. HTML contains assigned department'
  );
  assert(
    !htmlDataUri.includes('<img src="data:image/jpeg;base64,'),
    '8. HTML DOES NOT embed raw multi-megabyte data: URI inside <img src> (prevents payload bloat & email client rejection)'
  );
  assert(
    htmlDataUri.includes('Incident Photo Attached'),
    '9. HTML renders clean attachment banner when photo is a Data URI'
  );

  // 3. Test HTML generation with public HTTPS CDN photo
  const dummyReportWithCdn: IReportData = {
    ...dummyReportWithDataUri,
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'
  };

  const htmlCdn = BrevoService.generateComplaintEmailHtml(dummyReportWithCdn);
  assert(
    htmlCdn.includes('<img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5'),
    '10. HTML embeds standard <img src="https://..."> for external CDN URLs'
  );

  // 4. Test sendComplaintNotification guard check when key is absent/dummy
  // Temporarily clear key
  const originalKey = process.env.BREVO_API_KEY;
  delete process.env.BREVO_API_KEY;
  delete process.env.SENDINBLUE_API_KEY;
  delete process.env.BREVO_KEY;

  const skippedResult = await BrevoService.sendComplaintNotification(dummyReportWithDataUri);
  assert(
    skippedResult.sent === false,
    '11. sendComplaintNotification safely returns sent: false when key is missing'
  );
  assert(
    Boolean(skippedResult.error && skippedResult.error.includes('BREVO_API_KEY')),
    '12. Result contains descriptive message about missing API key'
  );

  // Restore
  if (originalKey) {
    process.env.BREVO_API_KEY = originalKey;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runBrevoUnitTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
