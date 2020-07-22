<script>
  import { range } from "./utils";
  export let size = 60;
  export let color = "#FF3E00";
  export let unit = "px";
</script>
<style>
  .wrapper {
    width: var(--size);
    height: var(--size);
  }
  .circle {
    border-radius: 100%;
    animation-fill-mode: both;
    position: absolute;
    opacity: 0;
    width: var(--size);
    height: var(--size);
    background-color: var(--color);
    animation: bounce 1s linear infinite;
  }
  @keyframes bounce {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    5% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
<div class="wrapper" style="--size: {size}{unit}; --color: {color}">
  {#each range(3, 1) as version}
  <div
    class="circle"
    style="animation-delay: {(version === 1) ? `0s` : (version === 2) ? `0.33333s` : (version === 3) ? `0.66666s`: `0s`}"
  ></div>
  {/each}
</div>
