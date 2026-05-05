let benchmarkAngle = 0;
let actualAngle = 0;
let laps = 0;
let lastActualAngle = 0;

function setup() {
  createCanvas(500, 500);
  angleMode(DEGREES);
}

function draw() {
  // 这种冷调深灰比较符合你提到的“Cold/Clean”审美
  background(28, 30, 32); 
  translate(width / 2, height / 2);

  // 1. 获取当前系统时间
  let hr = hour();
  let mn = minute();
  let sc = second();
  let ms = ceil(millis() % 1000);

  // 2. 绘制表盘外壳 (Gorpcore 风格极简设计)
  noFill();
  stroke(60);
  strokeWeight(4);
  rect(-120, -150, 240, 300, 40); // 表盘方圆框

  // 3. 计算指针角度
  // 基准针：每 60 秒一圈，平滑移动
  benchmarkAngle = map(sc + ms/1000, 0, 60, 0, 360);
  
  // 模拟实际速度：鼠标在画布右侧越高，速度越快
  // 这里的逻辑是：实际角度是累加的，模拟跑步的位移
  let speedMult = map(mouseX, 0, width, 0.5, 1.5); // 模拟配速波动
  actualAngle += (0.06 * 6 * speedMult); // 基础步进频率

  // 4. 绘制“差距区域” (The Gap)
  noStroke();
  fill(100, 150, 255, 50); // 淡淡的蓝色，代表领先/落后的差距
  arc(0, 0, 180, 180, benchmarkAngle - 90, (actualAngle % 360) - 90);

  // 5. 绘制当前时间 (满足作业核心要求)
  fill(200);
  noStroke();
  textAlign(CENTER);
  textSize(14);
  text(nf(hr, 2) + ":" + nf(mn, 2) + ":" + nf(sc, 2), 0, -110);
  textSize(10);
  text("CURRENT TIME", 0, -125);

  // 6. 绘制指针
  push();
  rotate(-90); // 修正起点到 12 点方向
  
  // 基准针 (Lighter Color)
  stroke(180);
  strokeWeight(3);
  line(0, 0, cos(benchmarkAngle) * 80, sin(benchmarkAngle) * 80);
  
  // 实际针 (Deeper Color)
  stroke(255, 100, 100); // 用一个醒目的颜色代表你自己
  strokeWeight(5);
  line(0, 0, cos(actualAngle % 360) * 85, sin(actualAngle % 360) * 85);
  pop();

  // 7. 绘制数据面板 (心率和 Lap)
  drawDataPanel(speedMult);
}

function drawDataPanel(speed) {
  fill(255);
  textSize(22);
  // 模拟心率：随速度波动
  let hrBeat = floor(120 + speed * 20 + random(2));
  text(hrBeat, 0, 40);
  textSize(10);
  fill(150);
  text("HEART RATE", 0, 55);

  // 计算 Lap (圈数)
  let currentLaps = floor(actualAngle / 360);
  fill(255);
  textSize(22);
  text(currentLaps, 0, 90);
  fill(150);
  textSize(10);
  text("LAPS COMPLETED", 0, 105);
  
  // 底部装饰线条
  stroke(50);
  line(-50, 70, 50, 70);
}