<script>
  export let size = "15px";
  export let color = "#ff3e00";
  export let margin = "1px";

  $: styles = [
    `height: ${size}`,
    `width: ${size}`,
    `background-color: ${color}`,
    `margin: ${margin}`
  ].join(";");
</script>

<div style="{styles}"/>
<div style="{styles}"/>
<div style="{styles}"/>

<style>
  div {
    display: inline-block;
    border-radius: 100%;
    box-sizing: content-box;
  }
  div:nth-child(1) {
    animation: 0.6s ease-in-out 0.07s infinite normal both running sync;
  }
  div:nth-child(2) {
    animation: 0.6s ease-in-out 0.14s infinite normal both running sync;
  }
  div:nth-child(3) {
    animation: 0.6s ease-in-out 0.21s infinite normal both running sync;
  }
  @keyframes sync {
    33% {
      transform: translateY(10px);
    }
    66% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0);
    }
  }
</style>
