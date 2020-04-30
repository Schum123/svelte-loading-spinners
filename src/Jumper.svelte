<script>
  import { css, keyframes } from "emotion";
  import { range } from "./utils";
  export let size = 60;
  export let color = '#FF3E00';
  export let unit = 'px';

  const bounce = keyframes`
  0% {opacity: 0;transform: scale(0);}
  5% {opacity: 1;}
  100% {opacity: 0;}
`;
  const wrapper = css`
    width: ${size+unit};
    height: ${size+unit};
  `;

  const circle = css`
    border-radius: 100%;
    animation-fill-mode: both;
    position: absolute;
    opacity: 0;
    width: ${size+unit};
    height: ${size+unit};
    animation: ${bounce} 1s linear infinite;
    background-color: ${color};
  `;
</script>

<div class="{wrapper}">
    {#each range(3, 1) as version}
    <div 
    class="{circle}"
    style="animation-delay: {(version === 1) ? `0s` : (version === 2) ? `0.33333s` : (version === 3) ? `0.66666s`: `0s`}"
    />
    {/each}
</div>