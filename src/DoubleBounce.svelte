<script>
  import { css, keyframes } from "emotion";
  import { range  } from './utils'
  export let size;
  export let color;

  const bounce = keyframes`
  0%, 100% {transform: scale(0)}
  50% {transform: scale(1.0)}
`;

  const wrapper = css`
    position: relative;
    width: ${size}px;
    height: ${size}px;
  `;
  const circle = css`
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    background-color: ${color};
    border-radius: 100%;
    opacity: 0.6;
    top: 0;
    left: 0;
    animation-fill-mode: both;
  `;
</script>

<div class="{wrapper}">
    {#each range(2, 1) as version}
    <div 
    class="{circle}"
    style="animation: {bounce} 2.1s {version === 1 ? `1s` : `0s`} infinite  ease-in-out"
    />
    {/each}
</div>
