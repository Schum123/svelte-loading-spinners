<script lang="ts">
  import {
    Circle,
    Circle2,
    Circle3,
    DoubleBounce,
    GoogleSpin,
    ScaleOut,
    SpinLine,
    Stretch,
    BarLoader,
    Jumper,
    RingLoader,
    SyncLoader,
    Rainbow,
    Wave,
    Firework,
    Pulse,
    Jellyfish,
    Chasing,
    Shadow,
    Square,
    Moon,
    Plane,
    Diamonds,
    Clock,
  } from "../../src/index";
  export let name: any;

  let color: string = "#FF3E00";
  let size: string = "60";
  let unit: string = "px";
  let colorPicker: any;

  let pause = false;

  function triggerColorPicker() {
    colorPicker.click();
  }
</script>

<style>
  .header {
    margin-top: 50px;
    display: flex;
    flex-direction: column;
  }
  h1 {
    color: #ff3e00;
    font-size: 48px;
    font-weight: 400;
    margin-top: 0;
    margin-bottom: 10px;
    text-align: center;
  }
  section {
    align-items: center;
    justify-items: center;
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    margin-top: 30px;
  }
  .spinner-item {
    min-width: 250px;
    min-height: 250px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  }
  .spinner-title {
    position: absolute;
    bottom: 20px;
  }
  .btn {
    margin-top: 20px;
    padding: 10px 30px;
    border-radius: 30px;
    display: block;
    margin: 0 auto;
    color: #fff;
    background-color: rgba(255, 62, 0, 1);
    transition: all 0.15s ease;
    box-sizing: border-box;
    text-transform: uppercase;
    text-decoration: none;
  }
  .btn:hover {
    background-color: rgba(255, 62, 0, 0.8);
  }
  input[type="color"] {
    display: none;
  }
  .color-value {
    display: block;
    margin-bottom: 10px;
  }
  .color-picker {
    position: sticky;
    margin-left: 35px;
    top: 50px;
    display: inline-block;
    z-index: 1;
  }
</style>

<div class="header">
  <h1>{name.default}</h1>
  <a href="https://github.com/Schum123/svelte-loading-spinners" class="btn">
    Github
  </a>
</div>
<div class="color-picker">
  <span class="color-value">Color: {color}</span>
  <button on:click={triggerColorPicker}>Change color</button>
  <input type="color" bind:value={color} bind:this={colorPicker} />
</div>

<section>
  <div class="spinner-item" title="SpinLine">
    <SpinLine {size} {color} />
    <div class="spinner-title">SpinLine</div>
  </div>

  <div class="spinner-item" title="Circle2">
    <Circle2
      {size}
      {unit}
      colorOuter="#FF3E00"
      colorCenter="#40B3FF"
      colorInner="#676778" />
    <div class="spinner-title">Circle2</div>
  </div>
  <div class="spinner-item" title="DoubleBounce">
    <DoubleBounce {size} {color} />
    <div class="spinner-title">DoubleBounce</div>
  </div>
  <div class="spinner-item" title="Circle">
    <Circle />
    <div class="spinner-title">Circle</div>
  </div>
  <div class="spinner-item" title="Stretch">
    <Stretch {size} {color} {unit} />
    <div class="spinner-title">Stretch</div>
  </div>
  <div class="spinner-item" title="Circle3">
    <Circle3
      {size}
      {unit}
      ballTopLeft="#FF3E00"
      ballTopRight="#F8B334"
      ballBottomLeft="#40B3FF"
      ballBottomRight="#676778" />
    <div class="spinner-title">Circle3</div>
  </div>
  <div class="spinner-item" title="BarLoader">
    <BarLoader {size} {color} {unit} />
    <div class="spinner-title">BarLoader</div>
  </div>
  <div class="spinner-item" title="SyncLoader">
    <SyncLoader {size} {color} />
    <div class="spinner-title">SyncLoader</div>
  </div>
  <div class="spinner-item" title="Jumper">
    <Jumper {size} {color} />
    <div class="spinner-title">Jumper</div>
  </div>
  <div class="spinner-item" title="GoogleSpin">
    <GoogleSpin size="60px" />
    <div class="spinner-title">GoogleSpin</div>
  </div>
  <div class="spinner-item" title="ScaleOut">
    <ScaleOut {size} {color} />
    <div class="spinner-title">ScaleOut</div>
  </div>
  <div class="spinner-item" title="RingLoader">
    <RingLoader {size} {color} />
    <div class="spinner-title">RingLoader</div>
  </div>
  <div class="spinner-item" title="Rainbow">
    <Rainbow {size} {color} />
    <div class="spinner-title">Rainbow</div>
  </div>
  <div class="spinner-item" title="Wave">
    <Wave {size} {color} />
    <div class="spinner-title">Wave</div>
  </div>
  <div class="spinner-item" title="Firework">
    <Firework {size} {color} />
    <div class="spinner-title">Firework</div>
  </div>
  <div class="spinner-item" title="Pulse">
    <Pulse {size} {color} />
    <div class="spinner-title">Pulse</div>
  </div>
  <div class="spinner-item" title="Jellyfish">
    <Jellyfish {size} {color} />
    <div class="spinner-title">Jellyfish</div>
  </div>
  <div class="spinner-item" title="Chasing">
    <Chasing {color} {unit} {size} />
    <div class="spinner-title">Chasing</div>
  </div>
  <div class="spinner-item" title="Shadow">
    <Shadow {size} {color} />
    <div class="spinner-title">Shadow</div>
  </div>
  <div class="spinner-item" title="Square">
    <Square {size} {color} />
    <div class="spinner-title">Square</div>
  </div>
  <div class="spinner-item" title="Moon">
    <Moon {size} {color} />
    <div class="spinner-title">Moon</div>
  </div>
  <div class="spinner-item" title="Plane">
    <Plane {size} {color} />
    <div class="spinner-title">Plane</div>
  </div>
  <div class="spinner-item" title="Diamonds">
    <Diamonds />
    <div class="spinner-title">Diamonds</div>
  </div>
  <div class="spinner-item" title="Clock">
    <Clock />
    <div class="spinner-title">Clock</div>
  </div>
</section>
