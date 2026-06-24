## Important Infos

### Kill process running on port 4000

```sh
(Get-NetTCPConnection -LocalPort 4000).OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```
