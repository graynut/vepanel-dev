<script>
const draggable = () => {
    return new Promise((resolve, reject) => {
        require(['vuedraggable'], resolve, reject)
    })
}
export default {
    name:'draggableIf',
    functional: true,
    props:{
        enable:Boolean,
    },
    render(h, ref) {
        return ref.props.enable ? h(draggable, ref.data, ref.children) : ref.children;
    }
}
</script>