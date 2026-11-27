# Registers, or removes, a Windows scheduled task that refreshes the local Office data twice a day:
# after the IDX close (17:00) and after the US close (06:00), in this computer's local time (WIB).
# A missed run (computer asleep or off) starts as soon as the computer is available again.
#
#   Install or update:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\schedule-refresh.ps1
#   Remove:             powershell -NoProfile -ExecutionPolicy Bypass -File scripts\schedule-refresh.ps1 -Remove
#   Last run's output:  .tools\refresh-last.log
param([switch]$Remove,[string]$IdxTime='17:00',[string]$UsTime='06:00')
$ErrorActionPreference='Stop'
$name='Longhand Office data refresh'
if($Remove){
  Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
  "Removed the scheduled task '$name'."
  return
}
$root=Split-Path -Parent $PSScriptRoot
$node=@("$root\.tools\security-node\node-v24.22.1-win-x64\node.exe","$env:LOCALAPPDATA\node-portable\node-v24.22.1-win-x64\node.exe") | Where-Object {Test-Path $_} | Select-Object -First 1
if(-not $node){$node=(Get-Command node -ErrorAction Stop).Source}
New-Item -ItemType Directory -Force (Join-Path $root '.tools') | Out-Null
$log=Join-Path $root '.tools\refresh-last.log'
# Hidden PowerShell host, so the refresh does not open a console window while it runs (about 15 minutes).
$command="& '$node' 'scripts/refresh-local-data.mjs' *> '$log'"
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -Command `"$command`"" -WorkingDirectory $root
$triggers=@((New-ScheduledTaskTrigger -Daily -At $IdxTime),(New-ScheduledTaskTrigger -Daily -At $UsTime))
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew
$description='Refreshes Longhand Office public data (prices, macro, rates, FX, sheets) into .pages-data. Runs scripts/refresh-local-data.mjs. Remove with scripts\schedule-refresh.ps1 -Remove.'
Register-ScheduledTask -TaskName $name -Action $action -Trigger $triggers -Settings $settings -Description $description -Force | Out-Null
"Registered '$name': daily at $IdxTime and $UsTime local time. Node: $node. Log: $log"
