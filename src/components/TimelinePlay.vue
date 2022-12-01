<template>
  <div class="df timeline-play-container" :style="{ ...commonStyle }">
    <div class="play-container df" @click="paly">
      <div :class="stop ? 'stop-btn' : 'play-btn'"></div>
      <div>{{ stop ? "暂停" : "播放" }}</div>
    </div>
    <div class="date-container df">
      <div class="calendar df" v-show="isShowCalendar">
        <div class="calendar-select" @click="calendarShow = !calendarShow">
          {{ showSelectDateString }}
        </div>
        <div class="change-date-text">更改日期</div>
        <div
          class="calendar-container"
          :class="calendarShow ? ' ' : ' hide-animation'"
          :style="{ opacity: calendarShow ? 1 : 0 }"
        >
          <div
            class="close-calendar-btn"
            @click="calendarShow = !calendarShow"
          ></div>
          <el-config-provider :locale="locale">
            <el-calendar v-model="checkDate" ref="calendar">
              <template #header="{ date }" class="calender-header">
                <div :style="{ color: themeColor, fontWeight: 700 }">
                  <span
                    @click="selectDate('prev-month')"
                    class="month prev-month"
                  ></span>
                  <span>{{ date }}</span>
                  <span
                    @click="selectDate('next-month')"
                    class="month next-month"
                  ></span>
                </div>
              </template>
              <template #date-cell="{ data }">
                <p
                  :class="data.isSelected ? 'is-selected' : ''"
                  :style="{
                    color: data.type === 'current-month' ? themeColor : '#ccc',
                  }"
                  class="date-td"
                  @click="changeSelectDate(data)"
                >
                  {{ data.day.split("-").slice(2).join("-") }}
                </p>
              </template>
            </el-calendar>
          </el-config-provider>
        </div>
      </div>
      <div class="time-line df">
        <div class="time-bg-bar" ref="timeBgBar">
          <div
            class="time-ball"
            :style="{ transform: `translate(${ballTranslate}px,-50%)` }"
          ></div>
        </div>

        <div class="time-text df">
          <div
            class="time-item df"
            v-for="(item, index) in times"
            @click="changeBallLeft(index)"
          >
            <div class="time-split"></div>
            <div>{{ item.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { nextTick, onMounted, ref } from "vue";
import { ElCalendar, ElConfigProvider } from "element-plus";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
const props = defineProps({
  //是否显示日历
  isShowCalendar: {
    type: Boolean,
    default: true,
  },
  //主题颜色
  themeColor: {
    type: String,
    default: "#3697d1",
  },
  commonStyle: {
    type: Object,
    default: {},
  },
});
const times = ref([
  { label: "08:00", date: "2022-10-22" },
  { label: "09:00", date: "2022-10-22" },
  { label: "10:00", date: "2022-10-22" },
  { label: "11:00", date: "2022-10-22" },
  { label: "12:00", date: "2022-10-22" },
  { label: "08:00", date: "2022-10-22" },
  { label: "09:00", date: "2022-10-22" },
  { label: "10:00", date: "2022-10-22" },
  { label: "11:00", date: "2022-10-22" },
  { label: "12:00", date: "2022-10-22" },
]);
const ballTranslate = ref(0);
const ballIndex = ref(0);
const checkDate = ref(new Date());
const showSelectDateString = ref("");
const locale = zhCn;
const calendarShow = ref(false);
const timeBgBar = ref();
const calendar = ref();
const stop = ref(false);
let timer = null;
const days = {
  0: "星期日",
  1: "星期一",
  2: "星期二",
  3: "星期三",
  4: "星期四",
  5: "星期五",
  6: "星期六",
};
onMounted(() => {
  const mm = checkDate.value.getMonth() + 1;
  const dd = checkDate.value.getDate();
  const yy = checkDate.value.getFullYear();
  showSelectDateString.value = `
  ${days[checkDate.value.getDay()]}, ${yy}-${("00" + mm).slice(-2)}-${(
    "00" + dd
  ).slice(-2)}`;
  ballTranslate.value = times.value.length - 1;
});
const changeBallLeft = (i) => {
  ballIndex.value = i;
  ballTranslate.value =
    i * ((timeBgBar.value.offsetWidth - 32) / (times.value.length - 1)) +
    (times.value.length - 1 - i);
};
const selectDate = (val) => {
  calendar.value.selectDate(val);
};
const changeSelectDate = (data) => {
  const ww = new Date(data.day).getDay();
  showSelectDateString.value = ` ${days[ww]},${data.day}`;
};
const paly = () => {
  stop.value = !stop.value;
  const l = times.value.length;
  if (ballIndex.value === l) {
    ballIndex.value = 0;
    ballTranslate.value =
      ballIndex.value *
        ((timeBgBar.value.offsetWidth - 32) / (times.value.length - 1)) +
      (times.value.length - 1 - ballIndex.value);

    timer && clearInterval(timer);
  }
  if (!stop.value) {
    //点击停止
    timer && clearInterval(timer);
    return;
  }
  timer = setInterval(() => {
    ballIndex.value++;
    console.log(ballIndex.value, "长度", l);
    if (ballIndex.value === l) {
      stop.value = false;
      clearInterval(timer);
      return;
    }
    ballTranslate.value =
      ballIndex.value *
        ((timeBgBar.value.offsetWidth - 32) / (times.value.length - 1)) +
      (times.value.length - 1 - ballIndex.value);
    // emit("changeIndex", currentIndex.value);
  }, 1000);
};
</script>
<style lang="scss" scoped>
.timeline-play-container {
  width: 100%;
  height: 100px;
  color: white;
  font-size: 14px;
  font-weight: 700;
}
.df {
  display: flex;
  align-items: center;
  justify-content: center;
}
.play-container {
  flex: 1 5%;
  flex-direction: column;
  line-height: 30px;
  cursor: pointer;
  .play-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: white;
    position: relative;
    &::before {
      content: "";
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-30%, -50%);
      border-color: transparent transparent transparent #3697d1;
      border-width: 8px 0 8px 12px;
      width: 0;
      height: 0;
      border-style: solid;
    }
  }
  .stop-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: white;
    position: relative;
    &::before {
      content: "";
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4px;
      height: 12px;
      border: 3px solid;
      border-color: transparent #3697d1 transparent #3697d1;
    }
  }
}
.date-container {
  flex: 0 1 95%;
  .calendar {
    flex-direction: column;
    position: relative;
    .calendar-select {
      background-color: white;
      border-radius: 24px;
      padding: 6px 30px;
      color: #3597d1;
      font-weight: 600;
      position: relative;
      &::after,
      &::before {
        content: "";
        position: absolute;
        border-top: 8px #fff solid;
        border-left: 6px transparent dashed;
        border-bottom: 8px transparent dashed;
        border-right: 6px transparent dashed;
        top: 12px;
        right: 12px;
        display: block;
      }
      &::after {
        top: 9px;
        border-top: 7px #fff solid;
      }
      &::before {
        border-top: 7px #3697d1 solid;
      }
    }
    .change-date-text {
      line-height: 40px;
    }
    .calendar-container {
      cursor: pointer;
      color: #333;
      position: absolute;
      bottom: 80px;
      left: -10px;
      width: auto;
      height: auto;
      background-color: #fff;
      border-radius: 10px;
      padding: 12px;
      transform: translateY(0) rotateX(0);
      transition: all 0.3s ease-in-out 0s;
      .is-selected {
        background: #f7a715;
        text-shadow: 1px 1px 3px rgb(0 0 0 / 40%);
        color: #fff !important;
      }
    }
    .close-calendar-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      border-radius: 50%;
      background-color: #3597d1;
      width: 30px;
      height: 30px;
      &::after,
      &::before {
        position: absolute;
        content: " ";
        background-color: #fff;
        left: 50%;
        top: 50%;
        width: 3px;
        height: 18px;
      }
      &::after {
        transform: translate(-50%, -50%) rotate(45deg);
      }
      &::before {
        transform: translate(-50%, -50%) rotate(-45deg);
      }
    }
    .hide-animation {
      transform: translateY(-100%) rotateX(90deg);
      transform-origin: center bottom 0;
      opacity: 0;
    }
  }
}
.time-line {
  flex-direction: column;
  flex: 1;
  .time-bg-bar {
    width: 100%;
    height: 16px;
    background: rgba(0, 0, 0, 0.333);
    border-radius: 8px;
    position: relative;
    .time-ball {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #fff;
      box-shadow: 2px 2px 8px #3597d1;
      top: 50%;
      // transform: translateY(-50%);
      z-index: 999;
      transition: all 500ms ease-in-out;
    }
  }
  .time-text {
    width: 100%;
    justify-content: space-between;
    cursor: pointer;
    .time-item {
      font-size: 16px;
      font-weight: 600;
      flex-direction: column;
      .time-split {
        width: 4px;
        height: 18px;
        background: rgba(0, 0, 0, 0.333);
      }
    }
  }
}

.date-td {
  padding: 6px;
}
.month {
  position: relative;
  cursor: pointer;
}
.next-month {
  &::after,
  &::before {
    content: "";
    position: absolute;
    border-top: 6px transparent dashed;
    border-left: 8px #fff solid;
    border-bottom: 8px transparent dashed;
    border-right: 6px transparent dashed;
    top: 1px;
    right: -24px;
    display: block;
  }
  &::after {
    right: -21px;
    border-left: 8px rgb(255, 255, 255) solid;
  }
  &::before {
    border-left: 8px #3697d1 solid;
  }
}
.prev-month {
  &::after,
  &::before {
    content: "";
    position: absolute;
    border-top: 6px transparent dashed;
    border-left: 6px transparent dashed;
    border-bottom: 8px transparent dashed;
    border-right: 8px #fff solid;
    top: 1px;
    right: 12px;
    display: block;
  }
  &::after {
    right: 9px;
    border-right: 8px #fff solid;
  }
  &::before {
    border-right: 8px #3697d1 solid;
  }
}
</style>
