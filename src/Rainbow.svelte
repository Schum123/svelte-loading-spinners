<script>
  import { css, keyframes } from "emotion";
  export let size;
  export let color;

  const rotate = keyframes`
    0% {border-width: 10px; }
    25% {border-width: 3px; }
    50% {transform: rotate(115deg);border-width: 10px;}
    75% {border-width: 3px;}
    100% {border-width: 10px;}
  `;

  const wrapper = css`
    width: ${size}px;
    height: ${size / 2}px;
    overflow: hidden;
  `;
  const rainbow = css`
    width: ${size}px;
    height: ${size}px;
    border-left-color: transparent;
    border-bottom-color: transparent;
    border-top-color: ${color};
    border-right-color: ${color};
    box-sizing: border-box;
    transform: rotate(-200deg);
    border-radius: 50%;
    border-style: solid;
    animation: 3s ease-in-out 0s infinite normal none running ${rotate};
  `;
</script>

<div class="{wrapper}">
  <div class="{rainbow}" />
</div>
