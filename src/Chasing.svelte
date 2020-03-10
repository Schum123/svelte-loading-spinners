<script>
  import { css, keyframes } from "emotion";
  import { calculateRgba, range } from "./utils";
  export let size;
  export let color;

  const rotate = keyframes`
    100% { transform: rotate(360deg);}
  `;

  const bounce = keyframes`
    0%, 
    100% { transform: scale(0.0);} 
    50% { transform: scale(1.0);}
  `;

  const wrapper = css`
    width: ${size}px;
    height: ${size}px;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const spinner = css`
    width: ${size}px;
    height: ${size}px;
    animation: ${rotate} 2s infinite linear;
  `;

  const dot = css`
    width: 60%;
    height: 60%;
    display: inline-block;
    position: absolute;
    top: 0;
    background-color: ${color};
    border-radius: 100%;
    animation: ${bounce} 2s infinite ease-in-out;
  `;
</script>
<div class="{wrapper}">
  <div class="{spinner}">
    {#each range(2, 0) as version}
    <div
      class="{dot}"
      style="animation-delay: {(version === 1) ? '-1.0s' : '0s'}; bottom: {(version === 1) ? '0' : ''}; top: {(version === 1) ? 'auto' : ''}"
    ></div>
    {/each}
  </div>
</div>
