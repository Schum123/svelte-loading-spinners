<script>
    import { calculateRgba } from './utils'
    export let size;
    export let color;
  
    $: styles = [
      `height: ${size/15}px`,
      `width: ${size*2}px`,
      `background-color: ${calculateRgba(color, 0.2)}`
    ].join(";");
    $: lineStyles = [
      `height: ${size/15}px`,
      `background-color: ${color}`
    ].join(";");
  </script>
  
  <div style={styles} class="wrapper">
      <div style={lineStyles} class="small-line one"/>
      <div style={lineStyles}  class="small-line two"/>
  </div>
  
  <style>
    .wrapper {
      position: relative;
      overflow: hidden;
      background-clip: padding-box;
    }
    .small-line {
      position: absolute;
      overflow: hidden;
      background-clip: padding-box;
      display: block;
      border-radius: 2px;
      will-change: left, right;
      animation-fill-mode: forwards;
    }
    .small-line.one {
      animation: 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) 0s infinite normal none running long;
    }
    .small-line.two {
      animation: 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite normal none running short;
      }
      @keyframes long {
      0% {
        left: -35%;
        right: 100%;
      }
      60% {
        left: 100%;
        right: -90%;
      }
      100% {
        left: 100%;
        right: -90%;
      }
    }
    @keyframes short {
      0% {
        left: -200%;
        right: 100%;
      }
      60% {
        left: 107%;
        right: -8%;
      }
      100% {
        left: 107%;
        right: -8%;
      }
    }
   
  </style>
  