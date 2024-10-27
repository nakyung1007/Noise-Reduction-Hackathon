const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// **********************실시간 소음 강도 확인을 위한 부분***************************
// *****************************************************************************

// 마이크 설정 및 실시간 소음 측정
let analyser;
let dataArray;
let microphone;

async function setupMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    microphone = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    microphone.connect(analyser);

    updateNoiseChart();
  } catch (error) {
    console.error("마이크 접근 오류:", error);
    alert("마이크 접근에 실패했습니다. 권한을 확인해주세요.");
  }
}

let updateCounter = 0;
const updateInterval = 5; // 5프레임마다 차트 업데이트 (약 0.2초마다)

function updateNoiseChart() {
  requestAnimationFrame(updateNoiseChart);

  analyser.getByteFrequencyData(dataArray);

  const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
  const noiseLevel = (average / 255) * 100;

  updateCounter++;

  if (updateCounter % updateInterval === 0) {
    const now = new Date();
    const timeString =
      now.getMinutes().toString().padStart(2, "0") +
      ":" +
      now.getSeconds().toString().padStart(2, "0");

    noiseChart.data.labels.push(timeString);
    noiseChart.data.datasets[0].data.push(noiseLevel);

    if (noiseChart.data.labels.length > 300) {
      noiseChart.data.labels.shift();
      noiseChart.data.datasets[0].data.shift();
    }

    noiseChart.update("none");
  }
}

document
  .getElementById("setupMicButton")
  .addEventListener("click", setupMicrophone);

// *****************************************************************************
// *****************************************************************************

// ****************************파형에 따른 소리 만들기******************************
// *****************************************************************************

// 디지털 신호 생성 - 파형 결정하기
const expandSignal = [
  0.0, 0.30902, 0.58779, 0.80902, 0.95106, 1.0, 0.95106, 0.80902, 0.58779,
  0.30902, 0.0, -0.30902, -0.58779, -0.80902, -0.95106, -1.0, -0.95106,
  -0.80902, -0.58779, -0.30902,
];

const digitalSignal = [
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
  ...expandSignal,
];

// 디지털 신호를 오디오 버퍼로 변환하는 함수
function createAudioBuffer(digitalSignal) {
  const buffer = audioContext.createBuffer(
    1,
    digitalSignal.length,
    audioContext.sampleRate
  );
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < digitalSignal.length; i++) {
    channelData[i] = digitalSignal[i];
  }

  console.log(buffer);
  return buffer;
}

// 역위상 무한 재생
let isPlaying = false;
let audioSource = null;

document.getElementById("playButton").addEventListener("click", function () {
  if (!isPlaying) {
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = createAudioBuffer(digitalSignal);
    audioSource.connect(audioContext.destination);

    // 체크박스 상태에 따라 반복 재생 설정
    const loopCheckbox = document.getElementById("loopCheckbox");
    audioSource.loop = loopCheckbox.checked;

    audioSource.start();
    isPlaying = true;
    this.textContent = "정지";
  } else {
    if (audioSource) {
      audioSource.stop();
      audioSource.disconnect();
    }
    isPlaying = false;
    this.textContent = "재생하여 상쇄하기";
  }
});

// AudioContext 상태 관리
document.addEventListener("click", function () {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const playButton = document.getElementById("playButton");
  const stressImg = document.querySelector(".stress-img");

  const toggledImage = "/static/images/기쁨.png";
  const originalImage = "/static/images/분노.png";

  let isToggled = false;

  playButton.addEventListener("click", function () {
    if (isToggled) {
      stressImg.style.backgroundImage = `url(${originalImage})`;
    } else {
      stressImg.style.backgroundImage = `url(${toggledImage})`;
    }
    isToggled = !isToggled;
  });
});

// 체크박스 상태 변경 시 오디오 소스의 반복 재생 설정 변경
document.getElementById("loopCheckbox").addEventListener("change", function () {
  if (isPlaying && audioSource) {
    audioSource.loop = this.checked;
  }
});

// ******************************차트 표현 부분***********************************
// *****************************************************************************
// 실시간 소음 차트
const noiseCtx = document.createElement("canvas").getContext("2d");
document.querySelector(".live-chart-container").appendChild(noiseCtx.canvas);
const noiseChart = new Chart(noiseCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "실시간 소음",
        data: [],
        borderColor: "green",
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: {
        title: { display: true, text: "시간" },
        ticks: { maxTicksLimit: 10 },
      },
      y: {
        title: { display: true, text: "소음 레벨" },
        min: 0,
        max: 100,
      },
    },
    animation: {
      duration: 0,
    },
  },
});

// 디지털 신호 차트
const digitalCtx = document.createElement("canvas").getContext("2d");
document.querySelector(".digital-signal-chart").appendChild(digitalCtx.canvas);
const digitalChart = new Chart(digitalCtx, {
  type: "line",
  data: {
    labels: Array.from({ length: digitalSignal.length }, (_, i) => i),
    datasets: [
      {
        label: "디지털 신호",
        data: digitalSignal,
        borderColor: "blue",
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: "샘플" } },
      y: { title: { display: true, text: "진폭" } },
    },
  },
});

// 아날로그 신호 차트
const analogCtx = document.createElement("canvas").getContext("2d");
document.querySelector(".analog-signal-chart").appendChild(analogCtx.canvas);
const analogChart = new Chart(analogCtx, {
  type: "line",
  data: {
    labels: Array.from({ length: digitalSignal.length }, (_, i) => i),
    datasets: [
      {
        label: "아날로그 신호 (보간)",
        data: digitalSignal,
        borderColor: "red",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: "샘플" } },
      y: { title: { display: true, text: "진폭" } },
    },
  },
});
// ****************************************************************************
// ****************************************************************************
