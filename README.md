Splatoon3のバトル戦績をstat.inkにアップロードします  
ステージ更新と同期して起動するように2時間おきのスケジュールを設定しています  
パブリックリポジトリでのGithub Actionsの無料利用を前提としているため、各種トークンはシークレットに設定しています  
コードはコチラのサイトのものを参考にさせて頂きました  
https://zenn.dev/mintommm/articles/auto-upload-splatoon-log-to-statink-via-ghactions  
  

Next To Do   
現状の仕様ではシークレットの内容が更新されないので、シークレットの情報を更新して起動の都度トークンを再取得しないようにする  
GitHubの仕様上自動でマスクされるが、ログにトークンの情報が上がってこないようにする他、最低限のセキュリティ管理について検討する
Discord Bot からトリガーして任意のタイミングで起動させる  
  
このリポジトリでは[s3s](https://github.com/frozenpandaman/s3s)を使用しています
