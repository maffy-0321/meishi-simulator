document.addEventListener('DOMContentLoaded', () => {
    // 各チェックボックスグループのセレクタを名刺デザイン見積もりシミュレーターのname属性に合わせて更新
    const basePriceCheckboxes = document.querySelectorAll('input[name="basePrice"]'); // 基本料金
    const copywritingFeeCheckboxes = document.querySelectorAll('input[name="copywritingFee"]'); // コピー作成費
    const optionOriginalDataCheckboxes = document.querySelectorAll('input[name="optionOriginalData"]'); // オプション（任意）のデザインデータ原本

    const totalPriceElement = document.getElementById('totalPrice');
    const exportPdfButton = document.getElementById('exportPdfButton');

    // ★★★ トグル機能の要素を取得 (名刺デザインでは「詳細」トグル) ★★★
    const toggleHeaders = document.querySelectorAll('.toggle-header');

    // アラートダイアログの要素を取得
    const pdfAlertDialog = document.getElementById('pdfAlertDialog');
    const alertOkButton = document.getElementById('alertOkButton');

    // ★★★ 排他選択を制御する関数（修正済み） ★★★
    function handleExclusiveCheckboxSelection(event, groupName) {
        const clickedCheckbox = event.target;
        const checkboxesInGroup = document.querySelectorAll(`input[name="${groupName}"]`);

        // コピー作成費のみ「選択しない」状態を許容
        const allowNoneSelected = (groupName === 'copywritingFee'); // 追加: コピー作成費のみ「選択しない」を許容

        checkboxesInGroup.forEach(checkbox => {
            if (checkbox !== clickedCheckbox) {
                checkbox.checked = false;
            }
        });

        // 選択しない状態を許容しないグループの場合、必ず一つ選択されているようにする
        if (!allowNoneSelected && !clickedCheckbox.checked) {
            // 他のチェックボックスが選択されていない場合、クリックされたものを再選択
            clickedCheckbox.checked = true;
        }

        updateTotalPrice();
    }

    // ★★★ 合計金額を計算・表示する関数 ★★★
    function updateTotalPrice() {
        let total = 0;

        // 基本料金 (排他選択)
        basePriceCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                total += parseInt(checkbox.dataset.price);
            }
        });

        // コピー作成費 (排他選択)
        copywritingFeeCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                total += parseInt(checkbox.dataset.price);
            }
        });

        // オプション（任意）のデザインデータ原本 (単独選択)
        // データ属性が "10000〜20000円" と範囲指定されているため、ここでは仮に最低価格を採用
        // 実際にはユーザーに選択させるか、別のロジックが必要です。
        optionOriginalDataCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                // "10000〜20000円" から最低価格の10000円を取得
                total += 10000;
            }
        });

        totalPriceElement.textContent = total.toLocaleString(); // 3桁カンマ区切りで表示
    }

    // ★★★ イベントリスナーの登録 ★★★
    basePriceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'basePrice'));
    });

    copywritingFeeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'copywritingFee'));
    });

    optionOriginalDataCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateTotalPrice);
    });

    // ★★★ トグル機能のイベントリスナー ★★★
    toggleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            if (header.classList.contains('active')) {
                // トグルを開くとき: スクロール高さを設定
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                // トグルを閉じるとき: 高さを0に戻す
                content.style.maxHeight = '0';
            }
        });
    });

    // 初期表示時に合計金額を更新
    updateTotalPrice();

    // PDF出力ボタンのクリックイベント
    exportPdfButton.addEventListener('click', () => {
        pdfAlertDialog.classList.add('visible'); // アラートを表示
    });

    // アラートのOKボタンクリックイベント
    alertOkButton.addEventListener('click', () => {
        pdfAlertDialog.classList.remove('visible'); // アラートを非表示

        // PDF生成処理を開始
        // html2canvasとjspdfの準備
        const { jsPDF } = window.jspdf;
        const input = document.getElementById('printableArea');

        html2canvas(input, {
            scale: 2, // 解像度を上げる
            useCORS: true // 画像が外部サーバーにある場合にCORSを有効にする
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4サイズ横幅 (mm)
            const pageHeight = 297; // A4サイズ縦幅 (mm)
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;

            const pdf = new jsPDF('p', 'mm', 'a4');
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save('名刺デザイン見積書.pdf');
        }).catch(err => {
            console.error("PDF生成中にエラーが発生しました:", err);
            alert("PDF生成中にエラーが発生しました。ブラウザのコンソールを確認してください。");
        });
    });
});
