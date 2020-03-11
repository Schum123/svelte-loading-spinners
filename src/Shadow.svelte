<script>
  import { css, keyframes } from "emotion";
  export let size;
  export let color;

  const load = keyframes`
    0% {box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;}
    5%,
    95% {box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;}
    10%,
    59% {box-shadow: 0 -0.83em 0 -0.4em, -0.087em -0.825em 0 -0.42em, -0.173em -0.812em 0 -0.44em, -0.256em -0.789em 0 -0.46em, -0.297em -0.775em 0 -0.477em;}
    20% {box-shadow: 0 -0.83em 0 -0.4em, -0.338em -0.758em 0 -0.42em, -0.555em -0.617em 0 -0.44em, -0.671em -0.488em 0 -0.46em, -0.749em -0.34em 0 -0.477em;}
    38% {box-shadow: 0 -0.83em 0 -0.4em, -0.377em -0.74em 0 -0.42em, -0.645em -0.522em 0 -0.44em, -0.775em -0.297em 0 -0.46em, -0.82em -0.09em 0 -0.477em;}
    100% {box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;}
  `;

  const round = keyframes`
  0% {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
  `;

  const wrapper = css`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${size}px;
    height: ${size}px;
  `;
  const shadow = css`
    color: ${color};
    font-size: 60px;
    overflow: hidden;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    margin: 28px auto;
    position: relative;
    transform: translateZ(0);
    animation: ${load} 1.7s infinite ease, ${round} 1.7s infinite ease;
  `;
</script>
<div class="{wrapper}">
  <div class="{shadow}" />
</div>
