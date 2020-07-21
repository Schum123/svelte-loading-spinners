<script>
  import { range } from "./utils";

  export let size = 60;
  export let color = "#FF3E00";
  export let duration = "1.2s";
  export let unit = "px";
</script>

<style>
  .wrapper {
    height: var(--size);
    width: var(--size);
    display: inline-block;
    text-align: center;
    font-size: 10px;
  }
  .rect {
    height: 100%;
    width: 10%;
    display: inline-block;
    margin-right: 4px;
    background-color: var(--color);
    animation: stretch var(--duration) ease-in-out infinite;
  }
  @keyframes stretch {
    0%,
    40%,
    100% {
      transform: scaleY(0.4);
    }
    20% {
      transform: scaleY(1);
    }
  }
</style>

<div
  class="wrapper"
  style="--size: {size}{unit}; --color: {color}; --duration: {duration}"
>
  {#each range(5, 1) as version}
  <div
    class="rect"
    style="animation-delay: {version === 2 ? '-1.1s' : version === 3 ? '-1s' : version === 4 ? '-0.9s' : version === 5 ? '-0.8s': ''}"
  ></div>
  {/each}
</div>
