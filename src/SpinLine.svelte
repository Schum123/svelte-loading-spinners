<script>
  import { css, keyframes } from "emotion";

  export let size;
  export let color;
  export let stroke = "5px";

  const spineLine = keyframes`
    0% {transform: rotate(-20deg);height: 5px;width: 75px;}
    5% {height: 5px;width: 75px;}
    30% {transform: rotate(380deg);height: 5px;width: 75px;}
    40% {transform: rotate(360deg);height: 5px;width: 75px;}
    55% {transform: rotate(0deg);height: 5px;width: 5px;}
    65% {transform: rotate(0deg);height: 5px;width: 85px;}
    68% {transform: rotate(0deg);height: 5px;}
    75% {transform: rotate(0deg);height: 5px;width: 1px;}
    78% {height: 5px;width: 5px;}
    90% {height: 5px;width: 75px;transform: rotate(0deg);}
    99%,
    100% {height: 5px;width: 75px;transform: rotate(-20deg);}
  `;

  const wrapper = css`
    width: ${size}px;
    height: ${stroke};
    transform: scale(${parseInt(size) / 75});
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  const line = css`
    width: ${size}px;
    height: ${stroke};
    background: ${color};
    border-radius: ${stroke};
    transform-origin: center center;
    animation: ${spineLine} 4s ease infinite;
  `;
</script>
<div class="{wrapper}">
  <div class="{line}"></div>
</div>
