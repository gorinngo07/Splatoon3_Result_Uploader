const axios = require('axios');
const sodium = require('tweetsodium');
const fs = require('fs');
const core = require('@actions/core'); // @actions/core モジュールをインポート

// GitHub パーソナルアクセストークン
const GITHUB_PAT = process.env.MY_GITHUB_PAT;

// シークレットを設定するリポジトリ情報
const REPO_OWNER = "gorinngo07";
const REPO_NAME = "Splatoon3_Result_Uploader";

// シークレットの名前とその値
const SECRET_NAME = "CONFIG_TXT";
const SECRET_FILE_PATH = process.argv[2];  // コマンドライン引数でファイルパスを受け取る

// GitHubの公開鍵を取得する関数
async function getPublicKey() {
  try {
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/public-key`, {
      headers: {
        Authorization: `Bearer ${GITHUB_PAT}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    return {
      key: response.data.key,
      key_id: response.data.key_id
    };
  } catch (error) {
    core.error("公開鍵の取得に失敗しました: " + error.message);
    if (error.response) {
      core.error(`レスポンスデータ: ${JSON.stringify(error.response.data)}`);
      core.error(`レスポンスステータス: ${error.response.status}`);
    }
    process.exit(1);
  }
}

// シークレットを暗号化する関数
function encryptSecret(publicKey, secretValue) {
  const key = Buffer.from(publicKey, 'base64');
  const value = Buffer.from(secretValue);

  // 公開鍵でシークレットを暗号化
  const encryptedBytes = sodium.seal(value, key);

  // base64 でエンコードされた暗号化された値を返す
  return Buffer.from(encryptedBytes).toString('base64');
}

// シークレットをGitHubに送信する関数
async function createOrUpdateSecret(keyId, encryptedValue) {
  try {
    const response = await axios.put(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/${SECRET_NAME}`,
      {
        encrypted_value: encryptedValue,
        key_id: keyId
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_PAT}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    core.info(`${SECRET_NAME} が正常に作成または更新されました`);
    core.info(`Response status: ${response.status}`);
  } catch (error) {
    core.error("シークレットの作成または更新に失敗しました: " + error.message);
    if (error.response) {
      core.error(`レスポンスデータ: ${JSON.stringify(error.response.data)}`);
      core.error(`レスポンスステータス: ${error.response.status}`);
    }
    process.exit(1);
  }
}

// メイン処理
(async () => {
  try {
    // 1. 公開鍵を取得
    core.info("公開鍵を取得しています...");
    const { key, key_id } = await getPublicKey();
    core.info("公開鍵の取得に成功しました");

    // 2. シークレットの内容を読み込み
    core.info("シークレットの内容を読み込んでいます...");
    const secretValue = fs.readFileSync(SECRET_FILE_PATH, 'utf-8');
    core.info("シークレットの内容を読み込みました");

    // シークレットの末尾5文字を表示
    core.info(`更新するシークレットの末尾5文字: ${secretValue.slice(-5)}`);

    // 3. シークレットを暗号化
    core.info("シークレットを暗号化しています...");
    const encryptedValue = encryptSecret(key, secretValue);
    core.info("シークレットの暗号化が完了しました");

    // 4. シークレットをGitHubに送信
    core.info("GitHubにシークレットを送信しています...");
    await createOrUpdateSecret(key_id, encryptedValue);
  } catch (error) {
    core.setFailed(`エラーが発生しました: ${error.message}`);
    if (error.response) {
      core.error(`レスポンスデータ: ${JSON.stringify(error.response.data)}`);
      core.error(`レスポンスステータス: ${error.response.status}`);
    }
  }
})();
