
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Set localStorage token so we look logged in
  await page.goto('http://localhost:5174');
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({id: 1, name: 'Admin', email: 'admin@test.com'}));
  });
  
  // Mock API requests
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/auth/me')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({id: 1, name: 'Admin', email: 'admin@test.com'})
      });
    } else if (request.url().includes('/customer/bookings')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({data: [
          {id: 1, status: 'paid', totalAmount: 100000, qrCode: '123-abc', showtime: {startTime: new Date().toISOString(), movie: {title: 'Test'}, room: {name: 'R1'}}}
        ]})
      });
    } else {
      request.continue();
    }
  });
  
  await page.goto('http://localhost:5174/profile');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();

