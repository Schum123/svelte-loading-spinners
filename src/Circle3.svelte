<script>
  import { css, keyframes } from "emotion";
  export let size = 60;
  export let unit = "px";
  export let ballTopLeft = "#FF3E00";
  export let ballTopRight = "#F8B334";
  export let ballBottomLeft = "#40B3FF";
  export let ballBottomRight = "#676778";

  const ballOne = keyframes`
  0% {
      position: absolute;
    }
    50% {
      top: 12px;
      left: 12px;
      position: absolute;
      opacity: 0.5;
    }
    100% {
      position: absolute;
    }
  `;
  const ballTwo = keyframes`
  0% {
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(360deg) scale(1.3);
    }
    100% {
      transform: rotate(720deg) scale(1);
    }
  `;
  const wrapper = css`
    width: ${size + unit};
    height: ${size + unit};
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 0;
    box-sizing: border-box;
  `;
  const inner = css`
    transform: scale(${parseInt(size) / 52});
  `;
  const ballContainer = css`
    animation: ${ballTwo} 1.5s infinite;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    position: relative;
  `;
  const singleBall = css`
    width: 44px;
    height: 44px;
    position: absolute;
  `;
  const ball = css`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    position: absolute;
    animation: ${ballOne} 1.5s infinite ease;
  `;
  const ballTL = css`
    background-color: ${ballTopLeft};
    top: 0;
    left: 0;
  `;
  const ballTR = css`
    background-color: ${ballTopRight};
    top: 0;
    left: 24px;
  `;
  const ballBL = css`
    background-color: ${ballBottomLeft};
    top: 24px;
    left: 0;
  `;
  const ballBR = css`
    background-color: ${ballBottomRight};
    top: 24px;
    left: 24px;
  `;
</script>

<div class="{wrapper}">
  <div class="{inner}">
    <div class="{ballContainer}">
      <div class="{singleBall}">
        <div class="{ball} {ballTL}">&nbsp;</div>
      </div>
      <div class="contener_mixte">
        <div class="{ball} {ballTR}">&nbsp;</div>
      </div>
      <div class="contener_mixte">
        <div class="{ball} {ballBL}">&nbsp;</div>
      </div>
      <div class="contener_mixte">
        <div class="{ball} {ballBR}">&nbsp;</div>
      </div>
    </div>
  </div>
</div>
