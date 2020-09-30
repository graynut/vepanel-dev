<template>
    <div class="app-full">
        <div class="index">
            <div class="logo">
                <svg viewBox="0 0 30 30" version="1.1" aria-hidden="true"><path d="M13.3 29Q15 30,16.7 29L26.3 23.5Q28 22.5,28 20.5V9.5Q28 7.5,26.3 6.5L16.7 1Q15 0,13.3 1L3.7 6.5Q2 7.5,2 9.5V20.5Q2 22.5,3.7 23.5ZM16.7 27Q15 28,13.3 27L5.5 22.5Q3.7 21.5,3.7 19.5V10.5Q3.7 8.5,5.5 7.5L13.3 3Q15 2,16.7 3L24.5 7.5Q26.3 8.5,26.3 10.5V19.5Q26.3 21.5,24.5 22.5ZM13.3 26Q15 27,16.7 26L19.3 24.5L4.6 16L4.6 19Q4.6 21,6.3 22ZM16.7 4Q15 3,13.3 4L10.7 5.5L25.4 14L25.4 11Q25.4 9,23.7 8ZM17.4 10.8Q19.2 10.7,20 12.3L15.5 20.2A1.5789473684210527 1.5789473684210527 0 0 1 12.9 18.7ZM12.6 19.2Q12.4 19,14.3 15.8L11.7 11.2Q9.9 11.1,9.1 12.7Z"></path></svg>
                <span>
                    <h1>VePanel</h1>
                    <h2>用于快速搭建中后台</h2>
                </span>
            </div>
            <p>
                <el-link type="info" target="_blank" href="https://graynut.github.io/vepanel-dev/">DOCUMENT</el-link>
                <el-link type="info" target="_blank" href="https://github.com/graynut/vepanel-dev/issues">ISSUESS</el-link>
                <el-link type="info" target="_blank" href="https://github.com/graynut/vepanel-dev">GITHUB</el-link>
            </p>
        </div>
    </div>
</template>

<style scoped>
.index{
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items:center;
    justify-content:center;
}
.index .logo{
    display: flex;
    align-items: center;
}
.index svg{
    height: 8em;
    margin-right: 4px;
    fill: #42b983;
}
.index h1{
    line-height: 1;
    font-size: 3.25em;
    margin: 0;
    color: #42b983;
}
.index h2{
    font-size:1.385em;
    font-weight: normal;
    margin: 0;
    color: var(--color-text-placeholder);
}
.index p{
    margin-top: 50px;
    display: flex;
    justify-content: space-between;
    width: 20em;
    padding-left: 14px;
}
</style>