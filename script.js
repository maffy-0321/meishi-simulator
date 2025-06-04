document.addEventListener('DOMContentLoaded', () => {
    // 各チェックボックスグループのセレクタを新しいname属性に合わせて更新
    const basePriceCheckboxes = document.querySelectorAll('input[name="basePrice"]');
    const copywritingFeeCheckboxes = document.querySelectorAll('input[name="copywritingFee"]');
    // 名刺デザインではフィニッシュオプションがないため、セレクタから削除
    // const finishOptionCheckboxes = document.querySelectorAll('input[name="finishOption"]'); 
    // オプション（任意）のデータ原本項目
    const optionOriginalDataCheckboxes = document.querySelectorAll('input[name="optionOriginalData"]'); 

    const totalPriceElement = document.getElementById('totalPrice');
    const exportPdfButton = document.getElementById('exportPdfButton');
    
    // ★★★ トグル機能の要素を取得 (今回はオプションのトグルのみ) ★★★
    const toggleHeaders = document.querySelectorAll('.toggle-header');

    // ★★★ 排他選択を制御する関数（変更なし） ★★★
    function handleExclusiveCheckboxSelection(event, groupName) {
        const clickedCheckbox = event.target;
        const checkboxesInGroup = document.querySelectorAll(`input[name="${groupName}"]`);

        // このグループ内で「選択されたものが無い」状態を許容するかどうかをここで判断
        // 名刺デザインのコピー作成費も「両方選択しない」を許容する可能性があります
        const allowNoneSelected = (groupName === 'copywritingFee'); 

        if (!clickedCheckbox.checked) {
            const currentlyChecked = Array.from(checkboxesInGroup).filter(cb => cb.checked);
            if (!allowNoneSelected && currentlyChecked.length === 0) {
                clickedCheckbox.checked = true;
            }
        }

        checkboxesInGroup.forEach(checkbox => {
            if (checkbox !== clickedCheckbox) {
                checkbox.checked = false;
            }
        });
        
        if (!clickedCheckbox.checked) {
            clickedCheckbox.checked = true;
        }

        calculateAndDisplayTotal();
    }

    // ★★★ 合計金額を計算して表示する関数（変更なし） ★★★
    function calculateAndDisplayTotal() {
        let currentTotal = 0;

        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                const price = parseInt(checkbox.dataset.price, 10);
                if (!isNaN(price)) {
                    currentTotal += price;
                }
            }
        });

        totalPriceElement.textContent = currentTotal.toLocaleString();
    }

    // ★★★ イベントリスナーの設定 ★★★

    // 1. 基本料金 (排他選択)
    basePriceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            handleExclusiveCheckboxSelection(event, 'basePrice');
        });
    });

    // 2. コピー作成費 (排他選択、両方なしも許容)
    copywritingFeeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            handleExclusiveCheckboxSelection(event, 'copywritingFee');
        });
    });

    // 3. フィニッシュオプションは名刺デザインにはないのでイベントリスナーは不要
    // finishOptionCheckboxes.forEach(...)

    // 4. オプション（任意）のデザインデータ原本 (通常のチェックボックス)
    optionOriginalDataCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', calculateAndDisplayTotal);
    });

    // ★★★ トグル機能のイベントリスナー（変更なし） ★★★
    toggleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const toggleContent = header.nextElementSibling;
            if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                if (toggleContent.style.display === 'block') {
                    toggleContent.style.display = 'none';
                    header.classList.remove('active');
                } else {
                    toggleContent.style.display = 'block';
                    header.classList.add('active');
                }
            }
        });
    });

    // ★★★ PDF出力ボタンのイベントリスナー（変更なし） ★★★
    exportPdfButton.addEventListener('click', () => {
        toggleHeaders.forEach(header => {
            header.classList.add('active');
            const toggleContent = header.nextElementSibling;
            if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                toggleContent.style.display = 'block';
            }
        });

        const input = document.getElementById('printableArea');

        html2canvas(input, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const fileName = `business_card_estimate_${year}${month}${day}_${hours}${minutes}.pdf`; // ファイル名変更

            pdf.save(fileName);
        });
    });

    // ★★★ ページロード時の初期設定 ★★★
    function initializeExclusiveSelection(checkboxesInGroup, defaultValue = null) {
        let isAnyChecked = false;
        checkboxesInGroup.forEach(checkbox => {
            if (checkbox.checked) {
                isAnyChecked = true;
            } else {
                checkbox.checked = false;
            }
        });

        if (!isAnyChecked && defaultValue !== null) {
            const defaultCheckbox = document.querySelector(`input[name="${checkboxesInGroup[0].name}"][value="${defaultValue}"]`);
            if (defaultCheckbox) {
                defaultCheckbox.checked = true;
            }
        }
    }

    // 各グループの初期選択を適用
    initializeExclusiveSelection(basePriceCheckboxes, 'one_side'); // 基本料金のデフォルトは片面デザイン
    // copywritingFeeCheckboxesはデフォルト選択なし（両方未選択を許容）
    initializeExclusiveSelection(copywritingFeeCheckboxes); // 初期選択なし
    
    // オプションは初期状態では選択しない
    optionOriginalDataCheckboxes.forEach(checkbox => checkbox.checked = false);

    calculateAndDisplayTotal();
});