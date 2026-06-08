$users = @(
  @{ session = "superadmin"; email = "admin@vibecrm.com"; label = "Superadmin" },
  @{ session = "demo"; email = "demo@vibecrm.com"; label = "Demo Owner" },
  @{ session = "solo"; email = "tset@test.com"; label = "Solo User" },
  @{ session = "wsadmin"; email = "wsadmin@vibecrm.com"; label = "WS Admin" },
  @{ session = "member"; email = "member@vibecrm.com"; label = "WS Member" }
)

$password = "password123"
$root = "c:\Users\fazt\Desktop\vibe-crm"
$snapshots = Join-Path $root "tests\snapshots"
New-Item -ItemType Directory -Force -Path $snapshots | Out-Null
Set-Location $root

npx playwright-cli close-all 2>$null | Out-Null

foreach ($u in $users) {
  $s = $u.session
  Write-Host "`n========== Testing $($u.label) ($($u.email)) =========="
  npx playwright-cli "-s=$s" open http://localhost:3000/login
  npx playwright-cli "-s=$s" fill e26 $u.email
  npx playwright-cli "-s=$s" fill e28 $password
  npx playwright-cli "-s=$s" click e29
  Start-Sleep -Seconds 3
  npx playwright-cli "-s=$s" snapshot --filename="$snapshots\role-$s-dashboard.yaml"
  npx playwright-cli "-s=$s" goto http://localhost:3000/opportunities
  Start-Sleep -Seconds 2
  npx playwright-cli "-s=$s" snapshot --filename="$snapshots\role-$s-opportunities.yaml"
  npx playwright-cli "-s=$s" goto http://localhost:3000/settings/admin/roles
  Start-Sleep -Seconds 2
  npx playwright-cli "-s=$s" snapshot --filename="$snapshots\role-$s-admin.yaml"
  npx playwright-cli "-s=$s" close 2>$null | Out-Null
}

Write-Host "`nDone."
