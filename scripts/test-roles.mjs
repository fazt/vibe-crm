// Playwright run-code payload — tests each seed role
export default async function (page) {
  const PASS = 'password123';
  const users = [
    { key: 'superadmin', email: 'admin@vibecrm.com', expectAdmin: true, expectWorkspace: false },
    { key: 'demo-owner', email: 'demo@vibecrm.com', expectAdmin: false, expectWorkspace: true, workspace: 'Demo Agency' },
    { key: 'solo-user', email: 'tset@test.com', expectAdmin: false, expectWorkspace: true, workspace: 'mytestcompany' },
    { key: 'ws-admin', email: 'wsadmin@vibecrm.com', expectAdmin: false, expectWorkspace: true, workspace: 'Demo Agency' },
    { key: 'ws-member', email: 'member@vibecrm.com', expectAdmin: false, expectWorkspace: true, workspace: 'Demo Agency' },
  ];

  const results = [];

  for (const user of users) {
    const r = { user: user.key, email: user.email, login: false, workspace: null, adminVisible: false, kanbanCards: 0, errors: [] };

    try {
      await page.context().clearCookies();
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.clear());

      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password').fill(PASS);
      await page.getByRole('button', { name: 'Sign in' }).click();

      await page.waitForURL(/\/(dashboard|login)/, { timeout: 15000 });
      r.login = !page.url().includes('/login');
      if (!r.login) {
        r.errors.push('Login failed — still on login page');
        results.push(r);
        continue;
      }

      // Workspace switcher text
      const wsBtn = page.locator('header button, aside button').filter({ hasText: /Demo Agency|mytestcompany|No workspace|workspace/i }).first();
      const wsText = await page.locator('aside').getByRole('button').filter({ hasNot: page.locator('[aria-label]') }).first().textContent().catch(() => '');
      const sidebarText = await page.locator('aside').textContent().catch(() => '');
      r.workspace = sidebarText?.includes('No workspace') ? 'No workspace' : (user.workspace ?? 'unknown');
      if (user.expectWorkspace && sidebarText?.includes('No workspace')) {
        r.errors.push('Expected workspace but shows No workspace');
      }
      if (!user.expectWorkspace && !sidebarText?.includes('No workspace') && sidebarText?.includes('Demo Agency')) {
        r.workspace = 'Demo Agency (unexpected)';
      }

      // Admin section in sidebar
      r.adminVisible = sidebarText?.includes('Admin') && (sidebarText?.includes('Roles') || sidebarText?.includes('Users'));
      if (user.expectAdmin && !r.adminVisible) r.errors.push('Admin nav not visible for superadmin');
      if (!user.expectAdmin && r.adminVisible) r.errors.push('Admin nav visible but should be hidden');

      // Opportunities kanban
      await page.goto('http://localhost:3000/opportunities', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const kanbanText = await page.locator('main, [class*="flex"]').first().textContent().catch(() => '');
      const cardTitles = await page.locator('main p.text-sm.font-medium').allTextContents().catch(() => []);
      r.kanbanCards = cardTitles.filter((t) => t && !['Board', 'List'].includes(t)).length;

      if (user.expectWorkspace && r.kanbanCards === 0) {
        const hasColumns = (await page.getByText(/Lead|Proposal|Qualified/i).count()) > 0;
        if (!hasColumns) r.errors.push('Kanban did not load (no columns)');
      }

      // Admin page access
      if (user.expectAdmin) {
        await page.goto('http://localhost:3000/settings/admin/roles', { waitUntil: 'networkidle' });
        const hasCreateRole = (await page.getByRole('button', { name: /Create role/i }).count()) > 0;
        r.adminCreateRole = hasCreateRole;
        if (!hasCreateRole) r.errors.push('Create role button missing');
      } else {
        await page.goto('http://localhost:3000/settings/admin/roles', { waitUntil: 'networkidle' });
        const url = page.url();
        const redirected = url.includes('/dashboard') || !url.includes('/admin');
        r.adminBlocked = redirected || (await page.getByRole('button', { name: /Create role/i }).count()) === 0;
        if (!r.adminBlocked) r.errors.push('Non-admin can access admin roles page');
      }

      r.pass = r.errors.length === 0;
    } catch (e) {
      r.errors.push(String(e.message || e));
      r.pass = false;
    }

    results.push(r);
  }

  return { results, summary: results.map((x) => `${x.user}: ${x.pass ? 'PASS' : 'FAIL'} — ${x.errors.join('; ') || 'ok'}`) };
}
