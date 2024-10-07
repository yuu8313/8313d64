document.addEventListener('DOMContentLoaded', () => {
    const encodeFile = document.getElementById('encodeFile');
    const encodeButton = document.getElementById('encodeButton');
    const decodeFile = document.getElementById('decodeFile');
    const decodeButton = document.getElementById('decodeButton');
    const progressBar = document.getElementById('progressBar');
    const statusMessage = document.getElementById('statusMessage');
    const previewArea = document.getElementById('previewArea');
    const useCompression = document.getElementById('useCompression');
    const useDecompression = document.getElementById('useDecompression');

    const allowedExtensions = ['png', 'webp', 'jpg', 'jpeg', 'gif', 'avif', 'mp3', 'ogg', 'aac', 'wav', 'csv', 'svg', 'html', 'css', 'js', 'py', 'pdf', 'md', 'mp4', 'webm'];

    encodeButton.addEventListener('click', encodeAndDownload);
    decodeButton.addEventListener('click', decodeAndDownload);

    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
        statusMessage.textContent = `処理中... ${percent}%`;
    }

    function resetProgress() {
        progressBar.style.width = '0%';
        statusMessage.textContent = '';
    }

    function isValidFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return allowedExtensions.includes(extension);
    }

    async function encodeAndDownload() {
        const file = encodeFile.files[0];
        if (!file) {
            alert('変換するファイルを選択してください。');
            return;
        }

        if (!isValidFileType(file)) {
            alert('サポートされていないファイル形式です。');
            return;
        }

        resetProgress();
        encodeButton.classList.add('processing');

        try {
            let base64 = await readFileAsBase64(file);
            updateProgress(33);

            // 圧縮を使用するか確認
            if (useCompression.checked) {
                base64 = LZString.compressToBase64(base64);
            }
            updateProgress(66);

            const blob = new Blob([base64], {type: 'text/plain'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = file.name + '.8313b64';
            link.click();

            updateProgress(100);
            statusMessage.textContent = '変換完了！ダウンロードを開始します。';
            previewArea.value = base64.substring(0, 100) + '...';
        } catch (error) {
            console.error('変換エラー:', error);
            statusMessage.textContent = `変換中にエラーが発生しました: ${error.message}`;
        } finally {
            encodeButton.classList.remove('processing');
        }
    }

    async function decodeAndDownload() {
        const file = decodeFile.files[0];
        if (!file || !file.name.endsWith('.8313b64')) {
            alert('変換する.8313b64ファイルを選択してください。');
            return;
        }

        resetProgress();
        decodeButton.classList.add('processing');

        try {
            let base64 = await readFileAsText(file);
            updateProgress(33);

            // 解凍を使用するか確認
            if (useDecompression.checked) {
                base64 = LZString.decompressFromBase64(base64);
            }
            updateProgress(66);

            if (!base64) {
                throw new Error('解凍中にエラーが発生しました。ファイルが壊れている可能性があります。');
            }

            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // 元の拡張子に戻す
            const originalFileName = file.name.replace('.8313b64', '');
            const extension = getOriginalExtension(byteArray, originalFileName) || '.bin'; // 拡張子を取得できない場合は「.bin」

            const blob = new Blob([byteArray], {type: 'application/octet-stream'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = originalFileName + extension;
            link.click();

            updateProgress(100);
            statusMessage.textContent = '変換完了！ダウンロードを開始します。';
            previewArea.value = base64.substring(0, 100) + '...';
        } catch (error) {
            console.error('解凍エラー:', error);
            statusMessage.textContent = `変換中にエラーが発生しました: ${error.message}`;
        } finally {
            decodeButton.classList.remove('processing');
        }
    }

    // 拡張子を判定する関数
    function getOriginalExtension(byteArray, fileName) {
        const extensionFromName = fileName.split('.').pop().toLowerCase();
        
        // テキストファイル系の拡張子はファイル名から直接復元
        const textExtensions = ['html', 'css', 'js', 'py', 'pdf', 'md', 'csv', 'svg'];
        if (textExtensions.includes(extensionFromName)) {
            return '.' + extensionFromName;
        }

        // バイナリファイルのヘッダーから拡張子を判定
        const header = byteArray.slice(0, 4).join(' ');

        switch (header) {
            case '255 216 255 224':
            case '255 216 255 225':
                return '.jpg'; // JPEG
            case '137 80 78 71':
                return '.png';   // PNG
            case '71 73 70 56':
                return '.gif';    // GIF
            case '82 73 70 70':
                return '.wav';    // WAV
            case '73 68 51':
                return '.mp3';    // MP3
            case '79 103 103 83':
                return '.ogg';    // OGG
            default:
                return '';         // 不明な場合
        }
    }

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                const result = e.target.result.split(',')[1];
                if (!result) {
                    reject(new Error('Base64エンコードが失敗しました。'));
                } else {
                    resolve(result);
                }
            };
            reader.onerror = () => reject(new Error('ファイルの読み取りに失敗しました。'));
            reader.readAsDataURL(file);
        });
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('ファイルの読み取りに失敗しました。'));
            reader.readAsText(file);
        });
    }
});
