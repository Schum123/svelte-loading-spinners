<script>
  export let size = "40px";
  export let color = "#ff3e00";
  export let stroke = "5px";
  $: lineStyles = [
    `width: ${size}`,
    `height: ${stroke}`,
    `background: ${color}`,
    `borderRadius:${stroke}`
  ].join(";");
  $: styles = [
    `width: ${size}`,
    `height: ${stroke}`,
    `transform: scale(${parseInt(size) / 75})`
  ].join(";");
</script>
<div style="{ styles }" class="spinner spinner--spin-line">
  <div style="{  lineStyles }" class="spinner-inner"></div>
</div>

<style lang="css">
  .spinner {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .spinner * {
      line-height: 0;
      box-sizing: border-box;
  }
  .spinner-inner {
    transform-origin: center center;
    animation: spin-line 4s ease infinite;
  }
  @keyframes spin-line {
    0% {
      transform: rotate(-20deg);
      height: 5px;
      width: 75px;
    }
    5% {
      height: 5px;
      width: 75px;
    }
    30% {
      transform: rotate(380deg);
      height: 5px;
      width: 75px;
    }
    40% {
      transform: rotate(360deg);
      height: 5px;
      width: 75px;
    }
    55% {
      transform: rotate(0deg);
      height: 5px;
      width: 5px;
    }
    65% {
      transform: rotate(0deg);
      height: 5px;
      width: 85px;
    }
    68% {
      transform: rotate(0deg);
      height: 5px;
    }
    75% {
      transform: rotate(0deg);
      height: 5px;
      width: 1px;
    }
    78% {
      height: 5px;
      width: 5px;
    }
    90% {
      height: 5px;
      width: 75px;
      transform: rotate(0deg);
    }
    99%,
    100% {
      height: 5px;
      width: 75px;
      transform: rotate(-20deg);
    }
  }
</style>
