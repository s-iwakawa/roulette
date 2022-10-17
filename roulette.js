(() => {
  'use strict';

  //背景色の配列
  const backgroundColor = [
      '#E60012',
      '#00A0E9',
      '#8FC31F',
      '#920783',
      '#009944',
      '#E5006A',
      '#009944',
      '#0068B7',
      '#F39800',
      '#E5004F',
      '#009E96',
      '#FFF100',
      '#1D2088',
      '#EB6100',
      '#0086D1',
      '#22AC38',
      '#BE0081',
  ];

  //名前,背景色の配列を作成
  const inputLabels = [];
  const labelColor = [];
  const splitRatio = [];

  //円グラフを作成する関数
  const showChart = (element, labels, splitRatio, color) => {
      const myChart = new Chart(element, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            backgroundColor: color,
            data: splitRatio,
            borderColor: '#fff',
            borderWidth: 1
          }]
        },
        options: {
          plugins: {
            tooltip: {
              enabled: false
            },
            //凡例を消す
            legend: {
              labels: {
                fontColor: 'black'
              },
              display: false
            },
            datalabels: {
              color: 'black',
              anchor: 'center',
              font: {
                weight: "bold",
                size: 35,
              },
              formatter: (value, element) => {
                let label = element.chart.data.labels[element.dataIndex];
                return label;
              },
            },
          },
          animation: false,   //グラフを表示させたときのアニメーションを消す
        },
        plugins: [
          ChartDataLabels,   //プラグインを使えるようにする
        ]
      });
  };

  //ルーレットが止まる先の矢印を表示する関数
  const showArrow = (parentElement) => {
    const arrow = document.createElement('canvas');
    const rouletteWidth = parentElement.clientWidth;
    arrow.setAttribute('width', rouletteWidth);
    arrow.setAttribute('height', 26);
    arrow.setAttribute('id', 'arrow');
    if (arrow.getContext) {
      const ctx = arrow.getContext('2d');
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(rouletteWidth/2, 25);
      ctx.lineTo(rouletteWidth/2 - 25, 0);
      ctx.lineTo(rouletteWidth/2 + 25, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    parentElement.appendChild(arrow);
  };

  //円の分割の配列を等分割で出力する関数
  const normalSplitRatio = (labelLength) => {
    const ratioArray = [];
    for (let count = 0; count < labelLength; count++) {
        ratioArray.push(100 / labelLength);
    }
    return ratioArray;
};

  //円の分割の配列をランダムで出力する関数(100/labelLength の値の ±50% の変動率)
  const randomSplitRatio = (labelLength) => {
    const ratioArray = [];
    const calculateRatio = () => {
        for (let count = 0; count < labelLength - 1; count++) {
            const random = Math.floor(Math.random() * 101) -50;
            const variation = (100 + random) / 100;
            const ratio = Math.floor(100 * variation / labelLength);
            ratioArray.push(ratio);
        }
        const sum = ratioArray.reduce((previousValue, currentValue) => previousValue + currentValue, 0)
        ratioArray.push(100 - sum);
    }
    calculateRatio();
    while (ratioArray[labelLength - 1 ] < 0.5 * 100 / labelLength || 1.5 * 100 / labelLength < ratioArray[labelLength - 1]) {
        ratioArray.splice(0);
        calculateRatio();
    }
    return ratioArray;
  };

  //判定関数
  const judgeSelectedLabel = (labelLength, revolution, splitRatioArray) => {
    const extraRevolution = revolution - 3600;
    const remainder = extraRevolution % 360;
    let selectedLabel = 0;
    const splitDegreeArray = [];
    splitRatioArray.forEach((key) => {
        splitDegreeArray.push(key * 360 /100);
    });
    const reversedSplitDegree = splitDegreeArray.reverse();
    reversedSplitDegree.reduce((previousValue, currentValue, currentIndex) => {
        if (previousValue <= remainder && remainder < previousValue + currentValue) {
          selectedLabel = (labelLength - 1) - currentIndex;
        }
        return previousValue + currentValue;
    }, 0);
    return selectedLabel;
  };

  //スタートボタンで呼び出される関数
  const startRotating = (initialDegree, finalDegree, duration) => {
    return new Promise((resolve) => {
      const keyFrames = new KeyframeEffect(
          document.getElementById('roulette'),
          [
          {transform: `rotate(${initialDegree}deg)`},   ///回転する前の角度（初期値）
          {transform: `rotate(${finalDegree}deg)`}   //回転した後の角度（終値）
          ],
          {
            duration: duration,   //１つのアニメーションにかかる時間(ミリ秒)
            easing: 'ease-in-out',   //始めゆっくりで、その後定回転で、終わりゆっくり
            iterations: 1,   //指定した動作の繰り返し数 ⇄ infinite でずっと
            fill: 'forwards',   //終わったときにどういう状態で止めるか　forwardsで終わったときの状態で止める
          }
        );
      const playAnimation = new Animation(keyFrames);
      playAnimation.play();
      playAnimation.onfinish = () => {resolve()};
    })
  };

  //結果表示の関数
  const showResultText = (parentElement, person, color) => {
    const showResult = document.createElement('p')
    showResult.id = 'result';
    showResult.textContent = `選ばれたのは ${person} でした！`;
    showResult.style.backgroundColor = color;
    showResult.style.fontWeight = 'bold';
    showResult.style.textAlign = 'center';
    showResult.style.fontSize = '30px';
    parentElement.appendChild(showResult);
  };

  //データ保持用のフィールドに反映する関数
  const reflectResult = (selectedLabel, revolution, splitRatio, record) => {
    record.record.決定者.value = inputLabels[selectedLabel];
    record.record.割合.value = splitRatio;
    record.record.回転数.value = revolution;
  };

  ////////////////
  ////////////////
  ///新規レコード作成画面表示直後の処理
  kintone.events.on('app.record.create.show', (event) => {
    //スペースの要素を取得して、canvasタグを生成
    const getSpaceElement =	kintone.app.record.getSpaceElement('circle');
    const suggestion = document.createElement('p');
    suggestion.textContent = 'テーブルに名前を追加してください';
    suggestion.style.fontWeight = 'bold';
    suggestion.style.textAlign = 'center';
    suggestion.style.fontSize = '30px';
    getSpaceElement.appendChild(suggestion);

    //startボタンの作成
    const getStartButton = kintone.app.record.getSpaceElement('start_button');
    const startButton = document.createElement('input');
    startButton.setAttribute('type', 'button');
    startButton.setAttribute('value', 'Start!');
    startButton.setAttribute('id', 'btn');
    getStartButton.appendChild(startButton);
    startButton.disabled = true;

    //お楽しみ要素の非表示
    kintone.app.record.setFieldShown('筋肉ルーレット', false);
    kintone.app.record.setFieldShown('ランダムレシオ', false);

    //

    //クリックでルーレット開始
    startButton.addEventListener('click', async() => {
      startButton.disabled = true;
      const getRecord = kintone.app.record.get();
      while (document.getElementById('result')) {
        kintone.app.record.getSpaceElement('circle').removeChild(document.getElementById('result'));
      }
      const revolution = 3600 + 7 * Math.floor( Math.random() * 361);
      const selectedLabel = judgeSelectedLabel(inputLabels.length, revolution, splitRatio);
      if (getRecord.record.筋肉ルーレット.value === 'オン') {
        await startRotating(0, revolution/2, 4000);
        await startRotating(revolution/2, revolution/2, 500);
        await startRotating(revolution/2, revolution, 4000);
      } else {
        await startRotating(0, revolution, 8000);
      }
      showResultText(kintone.app.record.getSpaceElement('circle'), inputLabels[selectedLabel], labelColor[selectedLabel]);
      reflectResult(selectedLabel, revolution, splitRatio, getRecord);
      kintone.app.record.set(getRecord);
      startButton.disabled = false;
    });
  });


  ////////////////
  ///新規レコード作成画面でテーブルの値が変わったときの処理
  //イベントリスト
  const eventList = [
    'app.record.edit.change.名前',
    'app.record.edit.change.ラジオボタン_追加',
    'app.record.edit.change.お楽しみボタン',
    'app.record.edit.change.ランダムレシオ',
    'app.record.create.change.名前',
    'app.record.create.change.ラジオボタン_追加',
    'app.record.create.change.お楽しみボタン',
    'app.record.create.change.ランダムレシオ'
  ];
  kintone.events.on(eventList, (event) => {
    const record = event.record;

    if (record.テーブル.value.length >= 1) document.getElementById('btn').disabled = false;
    if (record.お楽しみボタン.value === 'オン') {
      //お楽しみ要素の表示
      kintone.app.record.setFieldShown('筋肉ルーレット', true);
      kintone.app.record.setFieldShown('ランダムレシオ', true);
    } else {
      //お楽しみ要素を全てオフに変更
      record.筋肉ルーレット.value = 'オフ';
      record.ランダムレシオ.value = 'オフ';
      //お楽しみ要素の非表示
      kintone.app.record.setFieldShown('筋肉ルーレット', false);
      kintone.app.record.setFieldShown('ランダムレシオ', false);
    }
    if (document.getElementById('roulette') && document.getAnimations().length >= 1) {
      const runningAnimation = document.getAnimations();
      runningAnimation.map((element) => element.cancel());
    }

    //何もない状態でグラフが作成されることを防ぐ
    const chkArray = record.テーブル.value.map((key) => key.value.名前.value);
    if (chkArray.includes(undefined)) return event;

    //名前,背景色,割合の配列を空にする
    inputLabels.length = 0;
    labelColor.length = 0;
    splitRatio.length = 0;

    //テーブルの配列を取得
    const tblDataArray = record.テーブル.value;
    //ラジオボタンでフィールド変更不可, 名前の配列を取得
    Object.keys(tblDataArray).forEach((key) => {
      if (tblDataArray[key].value.ラジオボタン_追加.value === '追加'){
        tblDataArray[key].value.名前.disabled = false;
        if (tblDataArray[key].value.名前.value) {
          inputLabels.push(tblDataArray[key].value.名前.value);   //名前を配列に追加
          labelColor.push(backgroundColor[key]);   //背景色を配列に追加
        }
      } else {
        tblDataArray[key].value.名前.disabled = true;
      }
    })

    //人数で円を分割するための配列作成
    const dummyRatioArray = (event.record.ランダムレシオ.value === 'オン') ? randomSplitRatio(inputLabels.length) : normalSplitRatio(inputLabels.length);
    Object.keys(dummyRatioArray).forEach((key) => {
      splitRatio.push(dummyRatioArray[key]);
    });

    //空白スペースの要素を取得
    const getSpaceElement =	kintone.app.record.getSpaceElement('circle');
    while (getSpaceElement.firstChild) {
      getSpaceElement.removeChild(getSpaceElement.firstChild);  //結果表示があれば消す
    }
    const circleElement = document.createElement('canvas');  //canvasタグを作成
    circleElement.setAttribute('id', 'roulette');  //作成したcanvasに id='roulette' を追加

    showArrow(getSpaceElement);
    showChart(circleElement, inputLabels, splitRatio, labelColor);   //chart.jsよりグラフを作成
    //getSpaceElementに子要素を追加
    getSpaceElement.appendChild(circleElement);
    return event;
  });


  ////////////////
  ////////////////
  ///レコード編集画面表示直後の処理
  kintone.events.on('app.record.edit.show', (event) => {
    const record = event.record;

    //startボタンの作成
    const getStartButton = kintone.app.record.getSpaceElement('start_button');
    const startButton = document.createElement('input');
    startButton.setAttribute('type', 'button');
    startButton.setAttribute('value', 'Start!');
    startButton.setAttribute('id', 'btn');
    getStartButton.appendChild(startButton);

    if (record.テーブル.value.length >= 1) document.getElementById('btn').disabled = false;
    if (record.お楽しみボタン.value === 'オン') {
      //お楽しみ要素の表示
      kintone.app.record.setFieldShown('筋肉ルーレット', true);
      kintone.app.record.setFieldShown('ランダムレシオ', true);
    } else {
      //お楽しみ要素の非表示
      kintone.app.record.setFieldShown('筋肉ルーレット', false);
      kintone.app.record.setFieldShown('ランダムレシオ', false);
    }

    //何もない状態でグラフが作成されることを防ぐ
    const chkArray = record.テーブル.value.map((key) => key.value.名前.value);
    if (chkArray.includes(undefined)) return event;

    //名前,背景色,割合の配列を空にする
    inputLabels.length = 0;
    labelColor.length = 0;
    splitRatio.length = 0;

    //テーブルの配列を取得
    const tblDataArray = record.テーブル.value;
    //ラジオボタンでフィールド変更不可, 名前の配列を取得
    Object.keys(tblDataArray).forEach((key) => {
      if (tblDataArray[key].value.ラジオボタン_追加.value === '追加'){
        tblDataArray[key].value.名前.disabled = false;
        if (tblDataArray[key].value.名前.value) {
          inputLabels.push(tblDataArray[key].value.名前.value);   //名前を配列に追加
          labelColor.push(backgroundColor[key]);   //背景色を配列に追加
        }
      } else {
        tblDataArray[key].value.名前.disabled = true;
      }
    });

    //割合フィールドに保存されている文字列をsplitRatioにpush
    record.割合.value.split(',').map((value) => {
      splitRatio.push(value);
    });

    const getSpaceElement = kintone.app.record.getSpaceElement('circle');
    showArrow(getSpaceElement);

    const circleElement = document.createElement('canvas');  //canvasタグを作成
    circleElement.setAttribute('id', 'roulette');  //作成したcanvasに id='roulette' を追加
    showChart(circleElement, inputLabels, splitRatio, labelColor);   //chart.jsよりグラフを作成
    circleElement.style.transform = `rotate(${record.回転数.value}deg)`;
    getSpaceElement.appendChild(circleElement);

    showResultText(getSpaceElement, record.決定者.value, labelColor[inputLabels.findIndex(value => value === record.決定者.value)]);


    //クリックでルーレット開始
    startButton.addEventListener('click', async() => {
      startButton.disabled = true;
      const getRecord = kintone.app.record.get();
      while (document.getElementById('result')) {
        kintone.app.record.getSpaceElement('circle').removeChild(document.getElementById('result'));
      }
      const revolution = 3600 + 7 * Math.floor( Math.random() * 361);
      const selectedLabel = judgeSelectedLabel(inputLabels.length, revolution, splitRatio);
      if (getRecord.record.筋肉ルーレット.value === 'オン') {
        await startRotating(0, revolution/2, 4000);
        await startRotating(revolution/2, revolution/2, 500);
        await startRotating(revolution/2, revolution, 4000);
      } else {
        await startRotating(0, revolution, 8000);
      }
      showResultText(kintone.app.record.getSpaceElement('circle'), inputLabels[selectedLabel], labelColor[selectedLabel]);
      reflectResult(selectedLabel, revolution, splitRatio, getRecord);
      kintone.app.record.set(getRecord);
      startButton.disabled = false;
    });
  });

  ////////////////
  ///レコード詳細画面での動作
  kintone.events.on('app.record.detail.show', (event) => {
    const record = event.record;

    if (record.お楽しみボタン.value === 'オン') {
      //お楽しみ要素の表示
      kintone.app.record.setFieldShown('筋肉ルーレット', true);
      kintone.app.record.setFieldShown('ランダムレシオ', true);
    } else {
      //お楽しみ要素の非表示
      kintone.app.record.setFieldShown('筋肉ルーレット', false);
      kintone.app.record.setFieldShown('ランダムレシオ', false);
    }

    //名前,背景色,割合の配列を空にする
    inputLabels.length = 0;
    labelColor.length = 0;
    splitRatio.length = 0;

    //テーブルの配列を取得
    const tblDataArray = record.テーブル.value;
    //ラジオボタンでフィールド変更不可, 名前の配列を取得
    Object.keys(tblDataArray).forEach((key) => {
      if (tblDataArray[key].value.ラジオボタン_追加.value === '追加'){
        tblDataArray[key].value.名前.disabled = false;
        if (tblDataArray[key].value.名前.value) {
          inputLabels.push(tblDataArray[key].value.名前.value);   //名前を配列に追加
          labelColor.push(backgroundColor[key]);   //背景色を配列に追加
        }
      } else {
        tblDataArray[key].value.名前.disabled = true;
      }
    });

    //割合フィールドに保存されている文字列をsplitRatioにpush
    record.割合.value.split(',').map((value) => {
      splitRatio.push(value);
    });

    const getSpaceElement = kintone.app.record.getSpaceElement('circle');
    showArrow(getSpaceElement);

    const circleElement = document.createElement('canvas');  //canvasタグを作成
    circleElement.setAttribute('id', 'roulette');  //作成したcanvasに id='roulette' を追加
    showChart(circleElement, inputLabels, splitRatio, labelColor);   //chart.jsよりグラフを作成
    circleElement.style.transform = `rotate(${record.回転数.value}deg)`;
    getSpaceElement.appendChild(circleElement);

    showResultText(getSpaceElement, record.決定者.value, labelColor[inputLabels.findIndex(value => value === record.決定者.value)]);
  });

})();
