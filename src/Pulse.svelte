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
    width: var(--size);
    height: calc(var(--size) / 2.5);
  }
  .cube {
    position: absolute;
    top: 0px;
    width: calc(var(--size) / 5);
    height: calc(var(--size) / 2.5);
    background-color: var(--color);
    animation: motion 1.5s cubic-bezier(0.895, 0.03, 0.685, 0.22) infinite;
  }
  @keyframes motion {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
<div class="wrapper" style="--size: {size}{unit}; --color: {color}">
  {#each range(3, 0) as version}
  <div
    class="cube"
    style="animation-delay: {version * .15}s; left: {version * (size / 3 + size / 15)+unit};"
  ></div>
  {/each}
</div>
