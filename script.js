document.addEventListener('DOMContentLoaded', () => {
    // 各チェックボックスグループのセレクタを名刺デザイン見積もりシミュレーターのname属性に合わせて更新
    const basePriceCheckboxes = document.querySelectorAll('input[name="basePrice"]'); // 基本料金
    const copywritingFeeCheckboxes = document.querySelectorAll('input[name="copywritingFee"]'); // コピー作成費
    const optionOriginalDataCheckboxes = document.querySelectorAll('input[name="optionOriginalData"]'); // オプション（任意）のデザインデータ原本

    const totalPriceElement = document.getElementById('totalPrice');
    const exportPdfButton = document.getElementById('exportPdfButton');
    
    // ★★★ トグル機能の要素を取得 (名刺デザインでは「詳細」トグル) ★★★
    const toggleHeaders = document.querySelectorAll('.toggle-header');

    // ★★★ 排他選択を制御する関数（修正済み） ★★★
    function handleExclusiveCheckboxSelection(event, groupName) {
        const clickedCheckbox = event.target;
        const checkboxesInGroup = document.querySelectorAll(`input[name="${groupName}"]`);

        // コピー作成費のみ「選択しない」状態を許容
        const allowNoneSelected = (groupName === 'copywritingFee'); 

        // クリックされたチェックボックスが現在チェックされている場合
        if (clickedCheckbox.checked) {
            checkboxesInGroup.forEach(checkbox => {
                if (checkbox !== clickedCheckbox) {
                    checkbox.checked = false; // 他のチェックボックスをオフにする
                }
            });
        } else {
            // クリックされたものがオフになった場合
            const anyOtherChecked = Array.from(checkboxesInGroup).some(cb => cb.checked);
            if (!allowNoneSelected && !anyOtherChecked) {
                // noneを許容しないグループで、他が何もチェックされていない場合、自身を強制的にオンに戻す
                clickedCheckbox.checked = true;
            }
        }
        
        calculateAndDisplayTotal();
    }

    // ★★★ 合計金額を計算して表示する関数 ★★★
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
        checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'basePrice'));
    });

    // 2. コピー作成費 (排他選択、両方なしも許容)
    copywritingFeeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'copywritingFee'));
    });

    // 3. 名刺デザインにはフィニッシュオプションはないため、関連セレクタの参照は削除
    //    もしWebサイト制作シミュレーターとファイルを共用する場合は、HTMLに応じてセレクタを調整する必要がある

    // 4. オプション（任意）のデザインデータ原本 (通常のチェックボックス)
    optionOriginalDataCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', calculateAndDisplayTotal);
    });

    // ★★★ トグル機能のイベントリスナー ★★★
    toggleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const toggleContent = header.nextElementSibling;
            if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                // heightをmaxHeightに切り替えることでtransitionを有効にする
                if (toggleContent.style.maxHeight) { 
                    toggleContent.style.maxHeight = null; 
                    header.classList.remove('active');
                } else { 
                    toggleContent.style.maxHeight = toggleContent.scrollHeight + 'px'; 
                    header.classList.add('active');
                }
            }
        });
    });

    // ★★★ PDF出力ボタンのイベントリスナー ★★★
    exportPdfButton.addEventListener('click', () => {
        // ここに「PDFの出力はPCから行ってください」というアラートを追加
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            alert('PDFの出力はPCから行ってください。スマートフォンからの出力は表示が崩れる可能性が高いため、推奨しません。');
            // 必要であれば、ここでreturn; を追加してモバイルからのPDF生成を中断することもできます。
            // return; 
        }

        // PDF出力前に、一時的に全てのトグルを開く
        toggleHeaders.forEach(header => {
            header.classList.add('active');
            const toggleContent = header.nextElementSibling;
            if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                toggleContent.style.maxHeight = toggleContent.scrollHeight + 'px'; // 正しい高さを設定
                toggleContent.style.overflow = 'visible'; // overflowをvisibleに設定
            }
        });

        const input = document.getElementById('printableArea');

        html2canvas(input, { 
            scale: 2, // PCでの出力品質を重視し、高めのスケールに戻す
            useCORS: true, 
            logging: false,
            // 描画が途切れる場合のためのオプション (実験的)
            // allowTaint: true, // クロスオリジン画像を汚染して描画を許可
            // foreignObjectRendering: true // SVGやiframeなどの要素を正しくレンダリング (一部ブラウザで問題も)
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png'); // 品質を重視しPNGに戻す
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4'); // A4サイズ（210mm x 297mm）

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight); // PNG形式で追加
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight; 
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            
            // HTMLのタイトルタグからファイル名を動的に取得
            const pageTitle = document.title;
            const fileName = `${pageTitle}_${year}${month}${day}_${hours}${minutes}.pdf`; 

            pdf.save(fileName);

            // PDF出力後にトグルを元の状態に戻す
            toggleHeaders.forEach(header => {
                header.classList.remove('active');
                const toggleContent = header.nextElementSibling;
                if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                    toggleContent.style.maxHeight = null;
                    toggleContent.style.overflow = 'hidden';
                }
            });
        }).catch(error => {
            console.error("PDF生成中にエラーが発生しました:", error);
            alert("PDF生成中にエラーが発生しました。時間をおいて再度お試しいただくか、別のブラウザでお試しください。");
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

    // 各グループの初期選択を適用 (名刺デザイン見積もりシミュレーターのname属性に合わせて調整)
    initializeExclusiveSelection(basePriceCheckboxes, 'one_side'); // 基本料金のデフォルトは片面デザイン
    initializeExclusiveSelection(copywritingFeeCheckboxes); // コピー作成費はデフォルト選択なし（両方未選択を許容）
    
    // オプションは初期状態では選択しない
    optionOriginalDataCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    calculateAndDisplayTotal();
});