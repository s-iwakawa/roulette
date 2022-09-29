( async () => {
    'use strict';

    //イベントリスト
    const eventList = [
      'app.record.edit.show',
      'app.record.create.change.名前',
      'app.record.create.change.ラジオボタン_追加'
    ];

    //名前,背景色の配列を作成
    const inputLabels = [];
    const randomColor = [];

    //create.showの際には、下のテーブルに名前を追加してね！と表示
    const initShow = (event) => {
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

      return event;
    };

    //ハンドラーの定義
    const handler = (event) => {
      const record = event.record;

      //スペースの要素を取得して、canvasタグを生成
      const getSpaceElement =	kintone.app.record.getSpaceElement('circle');
      while (getSpaceElement.firstChild) {
        getSpaceElement.removeChild(getSpaceElement.firstChild);
      }
      const circleElement = document.createElement('canvas');
      circleElement.setAttribute('id', 'roulette');

      //名前,背景色の配列を作成
      inputLabels.splice(0);
      randomColor.splice(0);

      //テーブルの配列を取得
      const tblDataArray = record.テーブル.value;
      //ラジオボタンでフィールド変更不可, 名前の配列を取得
      Object.keys(tblDataArray).forEach((key) => {
        if (tblDataArray[key].value.ラジオボタン_追加.value === '追加'){
          tblDataArray[key].value.名前.disabled = false;
          if (tblDataArray[key].value.名前.value){

            //名前を配列に追加
            inputLabels.push(tblDataArray[key].value.名前.value);

            //ランダムに色を生成し、配列に追加
            let generateColor = Math.floor(Math.random() * 16777215).toString(16);
            for(let count = generateColor.length; count < 6; count++) {
            generateColor = "0" + generateColor;
            }
            randomColor.push("#" + generateColor);

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

      //円グラフを作成
      const myChart = new Chart(circleElement, {
        type: 'pie',
        data: {
          labels: inputLabels,
          datasets: [{
            backgroundColor: randomColor, //randamcolor　配列　inputLabelsと同じ数
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
              formatter: (value, circleElement) => {
                let label = circleElement.chart.data.labels[circleElement.dataIndex];
                return label;
              },
            },
          },
          //グラフを表示させたときのアニメーションを消す
          animation: false,
        },
        //プラグインを使えるようにする
        plugins: [
          ChartDataLabels,
        ]
      });

      //ルーレットが止まる先の矢印
      const arrow = document.createElement('canvas');
      const rouletteWidth = getSpaceElement.clientWidth;
      arrow.setAttribute('width', rouletteWidth);
      arrow.setAttribute('height', 30);
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

      //getSpaceElementに子要素を追加
      getSpaceElement.appendChild(arrow);
      getSpaceElement.appendChild(circleElement);

      //結果表示の要素を追加
      const resultElement = document.createElement('p');
      resultElement.setAttribute('id', 'result');
      getSpaceElement.appendChild(resultElement);


      return event;
    };


    //ルーレットスタート
    const startSpinning = () => {
      const getResultElement = document.getElementById('result');
      while (getResultElement.firstChild){
        getResultElement.removeChild(getResultElement.firstChild)
      }
      const extraRevolution = Math.floor( Math.random() * 361) //30degree を最小単位として５回転分を上限にランダムな角度を出力
      const revolution = 3600 + 5 * extraRevolution;
      const theta = 5 * extraRevolution - Math.floor(5 * extraRevolution / 360) * 360;
      const sectionDegree = 360/inputLabels.length;
      const selectedLabel = Number(inputLabels.length - Math.ceil(theta / sectionDegree));

      //結果表示の関数
      const showResultText = () => {
      const showResult = document.createElement('p')
      showResult.textContent = `選ばれたのは ${inputLabels[selectedLabel]} でした！`;
      showResult.style.backgroundColor = randomColor[selectedLabel];
      showResult.style.fontWeight = 'bold';
      showResult.style.textAlign = 'center';
      showResult.style.fontSize = '30px';
      getResultElement.appendChild(showResult)
      };

      const animeateDetail = (elem) => {
        elem.animate(
        [
          {transform: 'rotate(0deg)' },
          {transform: `rotate(${revolution}deg)`}
        ],
        {
          duration: 8000,
          easing: 'ease-in-out',
          iterations: 1,
          fill: 'forwards'
        }
        )
        window.setTimeout(showResultText, 8500);
      }

      animeateDetail(document.getElementById('roulette'));
    };

    kintone.events.on('app.record.create.show', initShow);
    kintone.events.on(eventList, handler);

  })();
