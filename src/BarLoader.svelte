<script>
  import { css, keyframes } from "emotion";
  import { calculateRgba, range  } from './utils'
  export let size;
  export let color;

const long = keyframes`
  0% {left: -35%;right: 100%}
  60% {left: 100%;right: -90%}
  100% {left: 100%;right: -90%}
`

const short = keyframes`
  0% {left: -200%;right: 100%}
  60% {left: 107%;right: -8%}
  100% {left: 107%;right: -8%}
`
export const wrapper = css`
  height: ${size/15}px;
  width: ${size*2}px;
  background-color: ${calculateRgba(color, 0.2)};
  position: relative;
  overflow: hidden;
  background-clip: padding-box;
`;

export const lines = css`
  height: ${size/15}px;
  background-color: ${color};
`;
export const smallLines = css`
  position: absolute;
  overflow: hidden;
  background-clip: padding-box;
  display: block;
  border-radius: 2px;
  will-change: left, right;
  animation-fill-mode: forwards;
`;
  </script>
  
  <div class="{wrapper}">
      {#each range(2, 1) as version}
      <div 
      class="{lines} {smallLines}"
      style="animation: {(version === 1 ? long : short)} 2.1s {(version === 2 ? `1.15s` : ``)} {(version === 1 ? `cubic-bezier(0.65, 0.815, 0.735, 0.395)` : `cubic-bezier(0.165, 0.84, 0.44, 1)`)} infinite"
      />
      {/each}
  </div>
  