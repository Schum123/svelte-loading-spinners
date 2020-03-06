<script>
  export let size = "40px";
  export let colorRgba = "rgba(255, 62, 0, 0.2)";
  export let color = "#ff3e00";
  export let height = "4px";
  export let width = "100px";

  $: styles = [
    `height: ${height}`,
    `width: ${width}`,
    `background-color: ${colorRgba}`
  ].join(";");
  $: lineStyles = [
    `height: ${height}`,
    `background-color: ${color}`
  ].join(";");
</script>

<div style={styles} class="wrapper">
    <div style={lineStyles} class="small-line one"/>
    <div style={lineStyles}  class="small-line two"/>
</div>

<style>
  .wrapper {
    position: relative;
    overflow: hidden;
    background-clip: padding-box;
  }
  .small-line {
    position: absolute;
    height: 4px;
    overflow: hidden;
    background-clip: padding-box;
    display: block;
    border-radius: 2px;
    will-change: left, right;
    animation-fill-mode: forwards;
  }
  .small-line.one {
    animation: 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) 0s infinite normal none running long;
  }
  .small-line.two {
    animation: 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite normal none running short;
    }
    @keyframes long {
    0% {
      left: -35%;
      right: 100%;
    }
    60% {
      left: 100%;
      right: -90%;
    }
    100% {
      left: 100%;
      right: -90%;
    }
  }
  @keyframes short {
    0% {
      left: -200%;
      right: 100%;
    }
    60% {
      left: 107%;
      right: -8%;
    }
    100% {
      left: 107%;
      right: -8%;
    }
  }
 
</style>
