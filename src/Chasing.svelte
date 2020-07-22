<script>
  import { calculateRgba, range } from "./utils";
  export let size = 60;
  export let color = "#FF3E00";
  export let unit = "px";
</script>

<style>
  .wrapper {
    height: var(--size);
    width: var(--size);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .spinner {
    height: var(--size);
    width: var(--size);
    animation: rotate 2s infinite linear;
  }
  .dot {
    width: 60%;
    height: 60%;
    display: inline-block;
    position: absolute;
    top: 0;
    background-color: var(--color);
    border-radius: 100%;
    animation: bounce 2s infinite ease-in-out;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes bounce {
    0%, 
    100% { transform: scale(0.0);} 
    50% { transform: scale(1.0);}
  }
</style>
<div class="wrapper" style="--size: {size}{unit}; --color: {color}">
  <div class="spinner">
    {#each range(2, 0) as version}
    <div
      class="dot"
      style="animation-delay: {(version===1)?'-1.0s': '0s'}; bottom: {(version===1)?'0': ''}; top: {(version===1)?'auto': ''};"
    ></div>
    {/each}
  </div>
</div>
