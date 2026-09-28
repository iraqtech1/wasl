import { defineComponent, h, Fragment } from "vue";
export default defineComponent({
  name: "RenderContent",
  props: ["content"],
  setup: (props) => () => h(Fragment, null, [props.content]),
});
