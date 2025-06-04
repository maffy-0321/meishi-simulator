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
        const allowNoneSelected
