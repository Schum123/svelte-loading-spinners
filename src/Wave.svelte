<script>
  import { range } from "./utils";
  export let size = 60;
  export let color = "#FF3E00";
  export let unit = "px";
</script>
<style>
  .wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: calc(var(--size) * 2.5);
    height: var(--size);
    overflow: hidden;
  }
  .bar {
    position: absolute;
    top: calc(var(--size) / 10);
    width: calc(var(--size) / 5);
    height: calc(var(--size) / 10);
    margin-top: calc(var(--size) - var(--size) / 10);
    transform: skewY(0deg);
    background-color: var(--color);
    animation: motion 1.25s ease-in-out infinite;
  }
  @keyframes motion {
    25% {
      transform: skewY(25deg);
    }
    50% {
      height: 100%;
      margin-top: 0;
    }
    75% {
      transform: skewY(-25deg);
    }
  }
</style>
<div class="wrapper" style="--size: {size}{unit}; --color: {color}">
  {#each range(10, 0) as version}
  <div
    class="bar"
    style="left: {version * (size / 5 + (size / 15 - size / 100))+unit}; animation-delay: {version * 0.15}s;"
  ></div>
  {/each}
</div>
