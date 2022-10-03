(() => {
  'use strict';

  //イベントリスト
  const eventList = [
    'app.record.edit.show',
    'app.record.create.change.名前',
    'app.record.create.change.ラジオボタン_追加'
  ];

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

  //結果表示の関数
  const showResultText = (parentElement, person, color) => {
    const showResult = document.createElement('p')
    showResult.textContent = `選ばれたのは ${person} でした！`;
    showResult.style.backgroundColor = color;
    showResult.style.fontWeight = 'bold';
    showResult.style.textAlign = 'center';
    showResult.style.fontSize = '30px';
    parentElement.appendChild(showResult);
  };

  //スタートボタンで呼び出される関数
  const startSpinning = () => {
    const getResultElement = document.getElementById('result');
    while (getResultElement.firstChild){
      getResultElement.removeChild(getResultElement.firstChild);
    }

    //ランダムで回転数を作成
    const extraRevolution = Math.floor( Math.random() * 361);
    const revolution = 3600 + 5 * extraRevolution;
    const theta = 5 * extraRevolution - Math.floor(5 * extraRevolution / 360) * 360;
    const sectionDegree = 360/inputLabels.length;
    const selectedLabel = Number(inputLabels.length - Math.ceil(theta / sectionDegree));

    //人数で円を等分割するための配列作成
    const splitRatio = [];
    inputLabels.forEach((key) => {
      splitRatio.push(100 / inputLabels.length);
    });

    //アニメーションを実行する関数
    const animateDetail = (elem) => {
      const keyFrames = new KeyframeEffect(
        elem,
        [
        {transform: 'rotate(0deg)' },   ///回転する前の角度（初期値）
        {transform: `rotate(${revolution}deg)`}   //回転した後の角度（終値）
        ],
        {
          duration: 8000,   //１つのアニメーションにかかる時間(ミリ秒)
          easing: 'ease-in-out',   //始めゆっくりで、その後定回転で、終わりゆっくり
          iterations: 1,   //指定した動作の繰り返し数 ⇄ infinite でずっと
          fill: 'forwards',   //終わったときにどういう状態で止めるか　forwardsで終わったときの状態で止める
        }
      );
      const playAnimation = new Animation(keyFrames);
      playAnimation.play();
      playAnimation.onfinish = () => {
        showResultText(getResultElement, inputLabels[selectedLabel], labelColor[selectedLabel]);
      }
    };
    animateDetail(document.getElementById('roulette'));
    const getRecord = kintone.app.record.get();
    getRecord.record.決定者.value = inputLabels[selectedLabel];
    getRecord.record.背景色.value = labelColor[selectedLabel];
    getRecord.record.回転数.value = revolution;
    kintone.app.record.set(getRecord);
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

    //クリックでルーレット開始
    startButton.addEventListener('click', startSpinning);
  });


  ////////////////
  ///新規レコード作成画面でテーブルの値が変わったときの処理
  kintone.events.on(eventList, (event) => {
    const record = event.record;
    //スペースの要素を取得して、canvasタグを生成
    const getSpaceElement =	kintone.app.record.getSpaceElement('circle');
    while (getSpaceElement.firstChild) {
      getSpaceElement.removeChild(getSpaceElement.firstChild);
    }
    const circleElement = document.createElement('canvas');
    circleElement.setAttribute('id', 'roulette');

    //名前,背景色の配列を空にする
    inputLabels.splice(0);
    labelColor.splice(0);

    //テーブルの配列を取得
    const tblDataArray = record.テーブル.value;
    //ラジオボタンでフィールド変更不可, 名前の配列を取得
    Object.keys(tblDataArray).forEach((key) => {
      if (tblDataArray[key].value.ラジオボタン_追加.value === '追加'){
        tblDataArray[key].value.名前.disabled = false;
        if (tblDataArray[key].value.名前.value){
          inputLabels.push(tblDataArray[key].value.名前.value);   //名前を配列に追加
          labelColor.push(backgroundColor[key]);   //背景色を配列に追加
        }
      } else {
        tblDataArray[key].value.名前.disabled = true;
      }
    })

    //人数で円を等分割するための配列作成
    const splitRatio = [];
    inputLabels.forEach((key) => {
      splitRatio.push(100 / inputLabels.length);
    });

    showChart(circleElement, inputLabels, splitRatio, labelColor);   //chart.jsよりグラフを作成
    showArrow(getSpaceElement);
    //getSpaceElementに子要素を追加
    getSpaceElement.appendChild(circleElement);

    //結果表示の要素を追加
    const resultElement = document.createElement('p');
    resultElement.setAttribute('id', 'result');
    getSpaceElement.appendChild(resultElement);


    return event;
  });

  ////////////////
  ///レコード詳細画面での動作
  kintone.events.on('app.record.detail.show', (event) => {
    //名前,背景色の配列を空にする
    inputLabels.splice(0);
    labelColor.splice(0);

    //
    const getSpaceElement = kintone.app.record.getSpaceElement('circle');
    const circleElement = document.createElement('canvas');
    //
    Object.keys(event.record.テーブル.value).forEach((key) => {
      inputLabels.push(event.record.テーブル.value[key].value.名前.value);
      labelColor.push(backgroundColor[key]);
    })

    //人数で円を等分割するための配列作成
    const splitRatio = [];
    inputLabels.forEach((key) => {
      splitRatio.push(100 / inputLabels.length);
    });
    showArrow(getSpaceElement);
    showChart(circleElement, inputLabels, splitRatio, labelColor);
    circleElement.style.transform = `rotate(${event.record.回転数.value}deg)`;
    getSpaceElement.appendChild(circleElement);
    showResultText(getSpaceElement, event.record.決定者.value, event.record.背景色.value);
  });

  })();
