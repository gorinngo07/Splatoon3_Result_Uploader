const axios = require('axios');
const sodium = require('tweetsodium');
const fs = require('fs');

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
    console.error("公開鍵の取得に失敗しました:", error.message);
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
    await axios.put(
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

    console.log(`${SECRET_NAME} が正常に作成または更新されました`);
  } catch (error) {
    console.error("シークレットの作成または更新に失敗しました:", error.response.data);
    process.exit(1);
  }
}

// メイン処理
(async () => {
  // 1. 公開鍵を取得
  const { key, key_id } = await getPublicKey();

  // 2. シークレットの内容を読み込み
  const secretValue = fs.readFileSync(SECRET_FILE_PATH, 'utf-8');

  // 3. シークレットを暗号化
  const encryptedValue = encryptSecret(key, secretValue);

  // 4. シークレットをGitHubに送信
  await createOrUpdateSecret(key_id, encryptedValue);
})();
