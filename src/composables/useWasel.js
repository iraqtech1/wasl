import {
  recommendVehicle,
  areas,
  nearestArea,
} from "../services/orderPolicy.js";
import { api as frontendApi } from "../services/api.js";
import { parseRoute, routeHash } from "../services/routes.js";
import { createCameraRenderers } from "../renderers/camera.js";
import { createAccountRenderers } from "../renderers/account.js";
import { createOrdersRenderers } from "../renderers/orders.js";
import { createAuthRenderers } from "../renderers/auth.js";
import { createUiRenderers } from "../renderers/ui.js";
import {
  h as vueH,
  mergeProps,
  shallowReactive,
  computed,
  defineComponent,
  nextTick,
  onMounted,
  onBeforeUnmount,
  withDirectives,
} from "vue";
import {
  attributes,
  fallback,
  clone,
  phoneDigits,
  phoneError,
  PHONE_FIELDS,
  PHONE_ATTRIBUTES,
} from "../renderers/helpers.js";
import { walletMotion } from "../renderers/walletMotion.js";
export function useWasel() {
  function viewContext() {
    return {
      h,
      mergeProps,
      attributes,
      input,
      button,
      icon,
      splashBike,
      money,
      date,
      roleNames,
      state,
      courierView,
      select,
      vehicleNames,
      provinces,
      coords,
      row,
      stepper,
      courierDocs,
      before,
      closed,
      metric,
      statusPicker,
      orderList,
      baseOrders,
      modal,
      natureNames,
      customerDue,
      maps,
      availableActions,
      startOrder,
      fallback,
      mapPlot,
      offlineDraftsView,
      ledger,
      readDrafts,
      cameraDialog,
      documentCapture,
      ui,
      nextTick,
      gatherCourier,
      navIcon,
      splashScenery,
      routeLines,
      authView,
      merchantRegistrationView,
      homeView,
      ordersView,
      orderDetail,
      orderWizard,
      orderActionForm,
      localMap,
      accountView,
      walletView,
      readiness,
      profileForm,
      drawDocumentCamera,
      reviewCourierRegistration,
    };
  }
  const {
    button,
    input,
    select,
    row,
    stepper,
    coords,
    maps,
    metric,
    ledger,
    navIcon,
    splashBike,
    splashScenery,
    routeLines,
  } = createUiRenderers(viewContext);
  const { authView, merchantRegistrationView, courierView } =
    createAuthRenderers(viewContext);
  const {
    homeView,
    statusPicker,
    baseOrders,
    ordersView,
    orderList,
    availableActions,
    orderDetail,
    orderWizard,
    orderActionForm,
    mapPlot,
    localMap,
  } = createOrdersRenderers(viewContext);
  const {
    accountView,
    walletView,
    offlineDraftsView,
    readDrafts,
    readiness,
    profileForm,
  } = createAccountRenderers(viewContext);
  const { drawDocumentCamera, reviewCourierRegistration } =
    createCameraRenderers(viewContext);
  const cleanups = [];
  const handlers = {
    click: [],
    submit: [],
    change: [],
    input: [],
    keydown: [],
  };
  const onEvent = (event, fn) => handlers[event].push(fn);
  const listen = (target, event, fn, options) => {
    onMounted(() => target.addEventListener(event, fn, options));
    cleanups.push(() => target.removeEventListener(event, fn, options));
  };
  const state = shallowReactive({
    S: null,
    screen: "home",
    filter: "all",
    homePage: 1,
    registryPage: 1,
    registrySize: "10",
    query: "",
    wizard: null,
    registration: null,
    offline: false,
    trackingId: null,
    authRole: null,
  });
  const ui = shallowReactive({
    page: "AuthView",
    auth: true,
    authError: "",
    formError: "",
    revision: 0,
    formRevision: 0,
    dialogTitle: "",
    dialogContent: null,
    cameraContent: null,
    cameraError: "",
    cameraReady: false,
    toast: "",
    splash: false,
    installed: false,
    installVisible: false,
    passwordVisible: false,
    loginPassword: "",
    loginPhone: "",
  });
  function h(tag, props, children) {
    if (typeof props === "object" && !Array.isArray(props) && props) {
      if (String(props.class || "").includes("inline-error"))
        children = [ui.formError];
      if (props.class === "camera-error") children = [ui.cameraError];
      if (
        props.class === "camera-actions" &&
        documentCapture &&
        !documentCapture.photo &&
        ui.cameraReady
      )
        children = [
          button(
            "document-shoot",
            ["التقاط الصورة ", icon("photo_camera")],
            "",
            "camera-primary",
          ),
        ];
      if (props["data-action"] === "install" && ui.installed)
        props = {
          ...props,
          hidden: true,
        };
      if (
        tag === "input" &&
        props.name === "password" &&
        ui.page === "AuthView"
      )
        props = {
          ...props,
          type: ui.passwordVisible ? "text" : "password",
          value: ui.loginPassword,
          onInput: (event) => {
            ui.loginPassword = event.target.value;
          },
        };
      if (
        tag === "input" &&
        props.name === "identifier" &&
        ui.page === "AuthView"
      )
        props = {
          ...props,
          value: ui.loginPhone,
          onInput: (event) => {
            ui.loginPhone = event.target.value;
          },
        };
      if (props["data-action"] === "toggle-password")
        children = [icon(ui.passwordVisible ? "visibility_off" : "visibility")];
    }
    if (props?.["data-action"] === "toggle-password")
      props = {
        ...props,
        "aria-label": ui.passwordVisible
          ? "إخفاء كلمة المرور"
          : "إظهار كلمة المرور",
        "aria-pressed": String(ui.passwordVisible),
      };
    const node =
      arguments.length === 2 ? vueH(tag, props) : vueH(tag, props, children);
    return tag === "section" && props?.class === "orbit-wallet"
      ? withDirectives(node, [[walletMotion, state.S?.balance]])
      : node;
  }
  function loginPage(error = "") {
    writeRoute(state.authRole, "login");
    ui.passwordVisible = false;
    ui.loginPassword = "";
    ui.loginPhone = "";
    ui.auth = true;
    ui.page = "AuthView";
    ui.authError = error;
    ui.formError = error;
    ui.revision++;
    window.scrollTo(0, 0);
  }
  function registrationView() {
    writeRoute(state.registration.role, "register");
    ui.formError = "";
    ui.auth = state.registration.role === "courier";
    ui.page =
      state.registration.role === "courier"
        ? "CourierRegistration"
        : "MerchantRegistration";
    ui.formRevision++;
    ui.revision++;
  }
  function courierRegistrationView() {
    writeRoute("courier", "register");
    ui.auth = true;
    ui.page = "CourierRegistration";
    ui.revision++;
  }
  ("use strict");

  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const esc = (x) =>
    String(x ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const money = (n) => new Intl.NumberFormat("en-US").format(n || 0),
    date = (x) =>
      x
        ? new Date(x).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "";
  const icon = (n) =>
    h(
      "span",
      {
        class: "material-symbols-outlined",
        "aria-hidden": "true",
      },
      [n],
    );
  const roleNames = {
    merchant: "التاجر",
    courier: "المندوب",
  };
  const vehicleNames = {
    motorcycle: "دراجة نارية",
    sedan: "سيارة صالون",
    truck: "سيارة حمل",
    refrigerated: "سيارة مبردة",
  };
  const natureNames = {
    normal: "عادية",
    fragile: "قابلة للكسر",
    food: "طعام",
    cold: "تحتاج إلى تبريد",
  };
  const before = [
      "draft",
      "published",
      "reserved",
      "approaching",
      "arrived",
      "waiting",
    ],
    closed = ["delivered", "returned", "cancelled", "completed"];
  const provinces = [
    "بغداد",
    "البصرة",
    "نينوى",
    "أربيل",
    "النجف",
    "كربلاء",
    "ذي قار",
    "بابل",
    "ديالى",
    "الأنبار",
    "صلاح الدين",
    "واسط",
    "ميسان",
    "المثنى",
    "القادسية",
    "كركوك",
    "السليمانية",
    "دهوك",
  ];
  let installPrompt = null,
    toastTimer;
  let lastLocationSent = 0;
  function toast(text) {
    ui.toast = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (ui.toast = ""), 5000);
  }
  async function api(url, data) {
    return frontendApi(url, data);
  }
  function modal(title, content) {
    ui.formError = "";
    ui.dialogTitle = title;
    ui.dialogContent = content;
    nextTick(() => $("#app-dialog")?.showModal());
  }
  function closeModal() {
    $("#app-dialog")?.close();
    ui.dialogContent = null;
  }
  function customerDue(o) {
    return o.amount + (o.feePayer === "customer" ? o.fee : 0);
  }
  async function refresh(draw = true) {
    try {
      state.S = await api("/api/state");
      state.offline = navigator.onLine === false;
      if (draw) render();
    } catch (error) {
      if (error.status === 401) {
        state.S = null;
        loginPage();
      } else toast(error.message);
    }
  }
  const splashKey = "wasel-splash-shown";
  function splashSeen() {
    try {
      return sessionStorage.getItem(splashKey) === "1";
    } catch {
      return false;
    }
  }
  function rememberSplash() {
    try {
      sessionStorage.setItem(splashKey, "1");
    } catch {}
  }
  function reducedMotion() {
    try {
      return matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }
  function showWelcomeSplash() {
    // A refresh, a back-navigation or a re-entry must neither replay the
    // greeting nor trap the visitor behind it.
    if (splashSeen()) return Promise.resolve();
    rememberSplash();
    ui.auth = true;
    ui.splash = true;
    return new Promise((resolve) => {
      const started = Date.now();
      let settled = false;
      let timer;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", dismissEarly);
        document.removeEventListener("pointerdown", dismissEarly);
        ui.splash = false;
        resolve();
      };
      // A tab restored from the background can drop pending timers, and a
      // visitor must always be able to step past the greeting — so coming
      // back to the page or tapping once closes it as well.
      const dismissEarly = () => {
        if (
          document.visibilityState === "visible" &&
          Date.now() - started >= 1000
        )
          finish();
      };
      timer = setTimeout(finish, reducedMotion() ? 700 : 3000);
      document.addEventListener("visibilitychange", dismissEarly);
      document.addEventListener("pointerdown", dismissEarly);
      cleanups.push(() => {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", dismissEarly);
        document.removeEventListener("pointerdown", dismissEarly);
        finish();
      });
    });
  }
  async function login(role, phone, password) {
    await api("/api/login", {
      role,
      phone,
      password,
    });
    state.screen = "home";
    state.filter = "all";
    state.homePage = 1;
    state.registryPage = 1;
    ui.loginPassword = "";
    ui.loginPhone = "";
    await refresh();
  }
  function nav() {
    const r = state.S.user.role;
    const list =
      r === "merchant"
        ? [
            ["home", "الرئيسية"],
            ["registry", "السجل"],
            ["new", "طلب جديد"],
            ["wallet", "المحفظة"],
            ["account", "حسابي"],
          ]
        : [
            ["home", "الرئيسية"],
            ["available", "المتاح"],
            ["registry", "طلباتي"],
            ["wallet", "المحفظة"],
            ["account", "حسابي"],
          ];
    return h(
      "div",
      list.map(([key, label]) =>
        h(
          "button",
          {
            type: "button",
            "data-action": "nav",
            "data-screen": key,
            class: {
              new: key === "new",
              active: key === state.screen,
            },
            "aria-current": key === state.screen ? "page" : undefined,
          },
          [navIcon(key), h("span", label)],
        ),
      ),
    );
  }
  function render() {
    ui.formError = "";
    if (!state.S) return loginPage();
    writeRoute(state.S.user.role, state.screen);
    ui.auth = false;
    ui.page =
      {
        home: "HomeView",
        registry: "OrdersView",
        available: "OrdersView",
        wallet: "WalletView",
        account: "AccountView",
        new: "OrderWizard",
      }[state.screen] || "HomeView";
    ui.revision++;
  }
  function startOrder(kind = "merchant", old = null) {
    state.wizard = {
      step: 0,
      id: old?.id,
      data: old
        ? clone(old)
        : {
            kind,
            amount: 0,
            count: 1,
            weight: 1,
            length: 20,
            width: 20,
            height: 20,
            nature: "normal",
            vehicle: "motorcycle",
            baseFee: 5000,
            fee: 5000,
            returnFee: 0,
            feePayer: "customer",
            service: "normal",
            collection: "none",
            notes: "",
            sender: {
              ...state.S.user,
            },
            recipient: {
              province: state.S.user.province,
              name: "",
              phone: "",
              phone2: "",
              area: "",
              address: "",
              landmark: "",
            },
          },
    };
    state.screen = "new";
    closeModal();
    render();
    window.scrollTo(0, 0);
  }
  function gatherOrder(form) {
    const f = Object.fromEntries(new FormData(form)),
      d = state.wizard.data;
    if (state.wizard.step === 0) {
      for (const key of [
        "amount",
        "count",
        "weight",
        "length",
        "width",
        "height",
        "baseFee",
        "returnFee",
      ])
        d[key] = Number(f[key]);
      for (const key of ["nature", "vehicle", "service", "feePayer"])
        d[key] = f[key];
      d.collection = f.collection || d.collection;
      if (!f.hasReturn) d.returnFee = 0;
      d.fee =
        d.baseFee + (d.service === "vip" ? state.S.settings.vipSurcharge : 0);
      if (d.kind === "free") {
        d.amount = 0;
        d.collection = "none";
      }
      if (d.returnFee > d.fee)
        throw Error("أجرة الراجع لا تتجاوز أجرة التوصيل");
      if (d.nature === "cold" && d.vehicle !== "refrigerated")
        throw Error("الشحنة المبردة تحتاج سيارة مبردة");
    } else if (state.wizard.step === 1 && d.kind === "free") {
      d.sender = {
        name: f.senderName,
        phone: f.senderPhone,
        address: f.senderAddress,
        area: f.senderArea,
        province: state.S.user.province,
        location: {
          lat: Number(f.lat),
          lng: Number(f.lng),
        },
      };
    } else if (state.wizard.step === 1) {
      d.sender = {
        name: state.S.user.name, phone: state.S.user.phone,
        province: state.S.user.province, phone2: state.S.user.phone2,
        area: f.senderArea, address: f.senderAddress,
        location: { lat: Number(f.lat), lng: Number(f.lng) },
      };
    } else if (state.wizard.step === 2) {
      d.recipient = {
        name: f.name,
        phone: f.phone,
        phone2: f.phone2,
        province: state.S.user.province,
        area: f.area,
        address: f.address,
        landmark: f.landmark,
        location:
          f.lat && f.lng
            ? {
                lat: Number(f.lat),
                lng: Number(f.lng),
              }
            : null,
      };
      if (!!f.lat !== !!f.lng) throw Error("أدخل خط العرض والطول معاً");
      d.notes = f.notes;
      d.saveCustomer = true;
      d.recipient.area = f.area === "other" ? f.otherArea : f.area;
    }
  }
  async function imageData(file) {
    if (!file) return null;
    if (!file.type.startsWith("image/")) throw Error("اختر ملف صورة");
    if (file.size > 15000000) throw Error("حجم الصورة كبير");
    return new Promise((resolve, reject) => {
      const image = new Image(),
        url = URL.createObjectURL(file);
      image.onload = () => {
        const ratio = Math.min(1, 900 / Math.max(image.width, image.height));
        const c = document.createElement("canvas");
        c.width = image.width * ratio;
        c.height = image.height * ratio;
        c.getContext("2d").drawImage(image, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.75));
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(Error("تعذرت قراءة الصورة"));
      };
      image.src = url;
    });
  }
  async function runAction(id, action, data = {}) {
    await api(`/api/orders/${encodeURIComponent(id)}/action`, {
      action,
      ...data,
    });
    await refresh();
    if (action === "delete") closeModal();
    else if (action === "chat")
      orderActionForm(
        state.S.orders.find((o) => o.id === id),
        "chat",
      );
    else orderDetail(id);
    toast("تم تسجيل الإجراء");
  }
  onEvent("click", async (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const a = b.dataset.action;
    try {
      if (a === "logout") {
        if (state.trackingId !== null) {
          navigator.geolocation.clearWatch(state.trackingId);
          state.trackingId = null;
        }
        await api("/api/logout", {});
        localStorage.removeItem("wasel-platform-two-role-snapshot");
        state.S = null;
        state.authRole = null;
        closeModal();
        loginPage();
      } else if (a === "login-page") {
        state.registration = null;
        loginPage();
      } else if (a === "choose-role") {
        if (!roleNames[b.dataset.role]) return;
        state.authRole = b.dataset.role;
        loginPage();
      } else if (a === "choose-again") {
        state.authRole = null;
        loginPage();
      } else if (a === "nav") {
        if (b.dataset.screen === "new") startOrder();
        else {
          state.screen = b.dataset.screen;
          state.wizard = null;
          state.filter = "all";
          state.homePage = 1;
          state.registryPage = 1;
          state.query = "";
          render();
          window.scrollTo(0, 0);
        }
      } else if (a === "refresh") await refresh();
      else if (a === "copy-wallet") {
        try {
          await navigator.clipboard.writeText(state.S.user.walletId);
          toast("تم نسخ رقم المحفظة");
        } catch {
          modal("رقم المحفظة", [
            h(
              "p",
              {
                class: "wallet-copy-value",
                dir: "ltr",
              },
              [state.S.user.walletId],
            ),
            h(
              "p",
              {
                class: "muted",
              },
              ["اضغط مطولاً على الرقم لنسخه."],
            ),
          ]);
        }
      } else if (a === "wallet-statement")
        modal("كشف المحفظة", [
          row("الرصيد الحالي", money(state.S.balance) + " د.ع"),
          ledger(state.S.ledger),
        ]);
      else if (a === "toggle-password") {
        const p = document.querySelector("#login-form input[name=password]");
        const visible = p.type === "password";
        // Capture autofilled values as well before Vue patches the input type.
        ui.loginPassword = p.value;
        ui.loginPhone = document.querySelector(
          "#login-form input[name=identifier]",
        ).value;
        ui.passwordVisible = visible;
        b.setAttribute(
          "aria-label",
          visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور",
        );
        b.setAttribute("aria-pressed", String(visible));
      } else if (a === "new-free") startOrder("free");
      else if (a === "order") orderDetail(b.dataset.id);
      else if (a === "filter-open") {
        const menu = $("#status-menu");
        if (menu.matches(":popover-open")) menu.hidePopover();
        else {
          menu.showPopover();
          const r = b.getBoundingClientRect(),
            w = Math.min(340, innerWidth - 24),
            above = r.top - 12,
            below = innerHeight - r.bottom - 12;
          menu.style.width = w + "px";
          menu.style.maxHeight = Math.min(450, Math.max(above, below)) + "px";
          menu.style.left =
            Math.max(12, Math.min(r.right - w, innerWidth - w - 12)) + "px";
          menu.style.top =
            (below < 350 && above > below
              ? Math.max(12, r.top - menu.offsetHeight - 8)
              : r.bottom + 8) + "px";
          b.setAttribute("aria-expanded", "true");
          menu.querySelector("[aria-selected=true]").focus({
            preventScroll: true,
          });
          menu.ontoggle = () =>
            b.setAttribute(
              "aria-expanded",
              String(menu.matches(":popover-open")),
            );
        }
      } else if (a === "home-page" || a === "registry-page") {
        state[a === "home-page" ? "homePage" : "registryPage"] = Math.max(
          1,
          Number(b.dataset.page) || 1,
        );
        await nextTick();
        const trigger = $("#status-trigger");
        trigger?.scrollIntoView({ block: "start", behavior: "smooth" });
        trigger?.focus({ preventScroll: true });
      } else if (a === "filter") {
        const menu = $("#status-menu");
        if (menu?.matches(":popover-open")) menu.hidePopover();
        state.filter = b.dataset.value;
        state.homePage = 1;
        state.registryPage = 1;
        render();
        $("#status-trigger")?.focus({ preventScroll: true });
      } else if (a === "wizard-back") {
        state.wizard.step--;
        ui.formRevision++;
        render();
      } else if (a === "save-order") {
        b.disabled = true;
        const data = {
          ...state.wizard.data,
          publish: b.dataset.publish === "true",
        };
        if (state.offline) {
          if (state.wizard.id || data.publish)
            throw Error("يمكن حفظ مسودة جديدة دون نشر فقط أثناء عدم الاتصال");
          const drafts = readDrafts();
          drafts.push(data);
          localStorage.setItem(
            "wasel-offline-" + state.S.user.id,
            JSON.stringify(drafts),
          );
          await api("/api/order-places", data);
          state.S = await api("/api/state");
          state.screen = "account";
          state.wizard = null;
          render();
          toast("حُفظت المسودة على هذا الجهاز");
        } else {
          if (state.wizard.id)
            await api(`/api/orders/${state.wizard.id}/action`, {
              ...data,
              action: "edit",
            });
          else await api("/api/orders", data);
          state.wizard = null;
          state.screen = "registry";
          await refresh();
          toast("حُفظ الطلب");
        }
      } else if (a === "sync-draft") {
        const drafts = readDrafts();
        await api("/api/orders", {
          ...drafts[Number(b.dataset.index)],
          publish: false,
        });
        drafts.splice(Number(b.dataset.index), 1);
        localStorage.setItem(
          "wasel-offline-" + state.S.user.id,
          JSON.stringify(drafts),
        );
        await refresh();
        toast("حُفظت المسودة في الخادم دون نشر");
      } else if (a === "refresh-chat") {
        await refresh(false);
        orderActionForm(
          state.S.orders.find((o) => o.id === b.dataset.id),
          "chat",
        );
      } else if (a === "order-action")
        orderActionForm(
          state.S.orders.find((o) => o.id === b.dataset.id),
          b.dataset.op,
          {
            offer: b.dataset.offer,
          },
        );
      else if (a === "readiness") readiness();
      else if (a === "tracking") {
        if (state.trackingId !== null) {
          navigator.geolocation.clearWatch(state.trackingId);
          state.trackingId = null;
          render();
          toast("توقفت مشاركة الموقع");
        } else {
          if (!navigator.geolocation) throw Error("الموقع غير مدعوم");
          state.trackingId = navigator.geolocation.watchPosition(
            async (pos) => {
              if (Date.now() - lastLocationSent < 15000) return;
              lastLocationSent = Date.now();
              try {
                await api("/api/profile", {
                  action: "location",
                  location: {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  },
                });
                await refresh(false);
              } catch (err) {
                toast(err.message);
              }
            },
            () => {
              navigator.geolocation.clearWatch(state.trackingId);
              state.trackingId = null;
              toast("تعذرت مشاركة الموقع؛ راجع إذن المتصفح");
            },
            {
              enableHighAccuracy: true,
              maximumAge: 10000,
              timeout: 20000,
            },
          );
          render();
          toast("المشاركة تعمل أثناء فتح التطبيق فقط");
        }
      } else if (a === "edit-profile") profileForm();
      else if (a === "change-password") {
        modal("تغيير كلمة مرور الحساب", [
          h("p", { class: "muted" }, [
            "هذه معاينة في النسخة التجريبية. تغيير كلمة المرور الفعلي يتفعّل عند ربط الحسابات بالخادم.",
          ]),
          h("form", { id: "password-change-form", class: "form-stack" }, [
            input(
              "newPassword",
              "كلمة المرور الجديدة",
              "",
              'type="password" required minlength="8" autocomplete="new-password"',
            ),
            input(
              "confirmPassword",
              "تأكيد كلمة المرور",
              "",
              'type="password" required minlength="8" autocomplete="new-password"',
            ),
            h("button", { type: "submit", class: "primary-button" }, [
              "التحقق من كلمة المرور",
            ]),
          ]),
        ]);
      } else if (a === "preferences") {
        await api("/api/profile", {
          action: "preferences",
          motivational: state.S.user.motivational === false,
        });
        await refresh();
      } else if (a === "nearby") localMap(true);
      else if (a === "merchant-map") localMap();
      else if (a === "notifications")
        modal("الإشعارات", [
          h(
            "ul",
            {
              class: "notice-list",
            },
            [
              fallback(
                state.S.notifications.map((n) =>
                  h("li", {}, [
                    n.text,
                    h(
                      "small",
                      {
                        class: "muted",
                        style: "display:block",
                      },
                      [date(n.at), " ", n.orderId || ""],
                    ),
                  ]),
                ),
                h("li", {}, ["لا توجد إشعارات بعد."]),
              ),
            ],
          ),
          h(
            "p",
            {
              class: "file-help",
            },
            [
              "تظهر التحديثات أثناء فتح التطبيق. إشعارات الدفع خارج التطبيق تحتاج إعداد خدمة Push.",
            ],
          ),
        ]);
      else if (a === "gps") {
        if (!navigator.geolocation) throw Error("الموقع غير مدعوم في المتصفح");
        const form = b.closest("form");
        b.disabled = true;
        navigator.geolocation.getCurrentPosition(
          (p) => {
            form.elements.lat.value = p.coords.latitude;
            form.elements.lng.value = p.coords.longitude;
            const area = nearestArea({
              lat: p.coords.latitude,
              lng: p.coords.longitude,
            });
            if (area && form.elements.area) {
              if (
                form.elements.area.tagName === "SELECT" &&
                ![...form.elements.area.options].some((o) => o.value === area)
              ) {
                form.elements.area.value = "other";
                if (form.elements.otherArea)
                  form.elements.otherArea.value = area;
              } else form.elements.area.value = area;
            }
            b.disabled = false;
            toast("تم تحديد الموقع؛ راجع العنوان والمنطقة");
          },
          () => {
            b.disabled = false;
            toast("تعذر تحديد الموقع؛ اختره بالضغط على الخريطة");
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
          },
        );
      } else if (a === "register-free") {
        modal(
          "حساب التوصيل الحر",
          h("form", { id: "free-register-form", class: "form-stack" }, [
            input("name", "الاسم", "", "required"),
            input("phone", "الهاتف", "", `required ${PHONE_ATTRIBUTES}`),
            select(
              "province",
              "المحافظة",
              Object.fromEntries(provinces.map((p) => [p, p])),
              "بغداد",
            ),
            input("area", "المنطقة", "", "required"),
            input("address", "العنوان", "", "required"),
            coords({ lat: 33.3, lng: 44.43 }),
            h("p", { class: "inline-error" }, []),
            h("button", { class: "primary-button", type: "submit" }, [
              "إنشاء الحساب",
            ]),
          ]),
        );
      } else if (a === "register") {
        state.registration = {
          step: 0,
          role: state.authRole || "merchant",
          activity: "shop",
          vehicle: "sedan",
          province: "بغداد",
          photos: [],
          location: {
            lat: 33.3,
            lng: 44.43,
          },
        };
        registrationView();
      } else if (a === "register-back") {
        state.registration.step--;
        registrationView();
      } else if (a === "install") {
        await requestAppInstall(b);
      }
    } catch (err) {
      toast(err.message);
      b.disabled = false;
    }
  });
  onEvent("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const f = Object.fromEntries(new FormData(form));
    const error = form.querySelector(".inline-error");
    ui.formError = "";
    const submit = form.querySelector("button[type=submit],button:not([type])");
    if (submit) submit.disabled = true;
    try {
      // Every phone field must hold eleven English digits once the user submits.
      for (const phoneField of form.elements)
        if (PHONE_FIELDS.has(phoneField.name)) {
          const problem = phoneError(phoneField.value);
          if (problem) throw Error(problem);
        }
      if (form.id === "free-register-form") {
        await api("/api/register", {
          ...f,
          role: "merchant",
          activity: "individual",
          location: { lat: Number(f.lat), lng: Number(f.lng) },
        });
        closeModal();
        await login("merchant", f.phone);
        startOrder("free");
      } else if (form.id === "login-form") {
        const identifier = f.identifier.trim();
        if (identifier !== "iraq") {
          const problem = phoneError(identifier);
          if (problem) throw Error(problem);
        }
        await login(
          f.role,
          identifier === "iraq" ? identifier : phoneDigits(identifier),
          f.password,
        );
      } else if (form.id === "password-change-form") {
        if (f.newPassword.length < 8)
          throw Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
        if (f.newPassword !== f.confirmPassword)
          throw Error("كلمتا المرور غير متطابقتين");
        form.reset();
        closeModal();
        toast("كلمة المرور صالحة. الحفظ الفعلي متاح بعد ربط الخادم.");
      } else if (form.id === "courier-register-form")
        reviewCourierRegistration();
      else if (form.id === "order-form") {
        gatherOrder(form);
        if (state.wizard.step === 1 && state.wizard.data.kind === "free") {
          const photo = await imageData(form.elements.photo.files[0]);
          if (photo) state.wizard.data.photo = photo;
        }
        state.wizard.step++;
        ui.formRevision++;
        render();
        window.scrollTo(0, 0);
      } else if (form.id === "register-form") {
        const r = state.registration;
        Object.assign(
          r,
          Object.fromEntries(
            Object.entries(f).filter(([k, v]) => typeof v === "string"),
          ),
        );
        if (r.step === 1 && r.role === "merchant" && r.activity === "ecommerce")
          throw Error("تسجيل التجارة الإلكترونية معطل حالياً؛ سيتاح لاحقاً");
        if (r.step === 2) {
          r.location = {
            lat: Number(f.lat),
            lng: Number(f.lng),
          };
          r.photos = [];
          for (const k of ["inside", "outside"])
            if (form.elements[k]?.files[0])
              r.photos.push(await imageData(form.elements[k].files[0]));
        }
        if (r.step === 3) {
          await api("/api/register", r);
          await login(r.role, r.phone, r.password);
          toast("تم إنشاء الحساب");
          state.registration = null;
        } else {
          r.step++;
          registrationView();
        }
      } else if (form.id === "action-form") {
        for (const name of ["confirmed", "inspected", "paid"])
          if (form.elements[name]) f[name] = form.elements[name].checked;
        if (f.reasonDetails) f.reason += " — " + f.reasonDetails;
        if (form.dataset.op === "retry")
          f.when = new Date(f.when).toISOString();
        if (form.dataset.op === "arrive") {
          if (!navigator.geolocation) throw Error("المتصفح لا يدعم تحديد الموقع");
          const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve,
            () => reject(Error("تعذر تحديد موقعك؛ اسمح بالوصول للموقع وأعد المحاولة")),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }));
          f.location = { lat: position.coords.latitude, lng: position.coords.longitude };
          f.accuracy = position.coords.accuracy;
        }
        await runAction(form.dataset.id, form.dataset.op, {
          ...f,
          offer: form.dataset.offer,
        });
      } else if (form.id === "readiness-form") {
        await api("/api/profile", {
          ...f,
          action: "readiness",
          available: form.elements.available.checked,
          location: {
            lat: Number(f.lat),
            lng: Number(f.lng),
          },
        });
        closeModal();
        await refresh();
      } else if (form.id === "account-location-form") {
        if (!f.lat || !f.lng) throw Error("حدد الموقع على الخريطة أولاً.");
        await api("/api/profile", {
          action: "location",
          location: { lat: Number(f.lat), lng: Number(f.lng) },
        });
        closeModal();
        await refresh();
        toast("تم حفظ موقع الحساب");
      } else if (form.id === "profile-form") {
        await api("/api/profile", {
          ...f,
          action: "profile",
          location: {
            lat: Number(f.lat),
            lng: Number(f.lng),
          },
        });
        closeModal();
        await refresh();
      }
    } catch (err) {
      if (error) ui.formError = err.message;
      else toast(err.message);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
  onEvent("change", (e) => {
    if (e.target.id === "registry-show-all") {
      state.registrySize = e.target.checked ? "all" : "10";
      state.registryPage = 1;
    }
    const f = e.target.form;
    if (f?.id === "order-form" && e.target.name === "area") {
      const other = f.querySelector(".other-area-field");
      if (other) other.hidden = e.target.value !== "other";
    }
    if (
      f?.id === "order-form" &&
      state.wizard?.step === 0 &&
      ["nature", "weight", "length", "width", "height"].includes(e.target.name)
    ) {
      const d = Object.fromEntries(new FormData(f));
      f.elements.vehicle.value = recommendVehicle(d, state.S.settings);
    }
    if (
      f?.id === "order-form" &&
      state.wizard?.step === 2 &&
      e.target.name === "phone"
    ) {
      const matches = (state.S.user.customers || []).filter(
        (c) => c.phone === e.target.value,
      );
      const select = f.elements.savedCustomer;
      for (const [id, key] of [
        ["recipient-names", "name"],
        ["recipient-addresses", "address"],
      ]) {
        const list = document.getElementById(id);
        if (list)
          list.replaceChildren(
            ...matches.map((c) =>
              Object.assign(document.createElement("option"), {
                value: c[key],
              }),
            ),
          );
      }
      if (select) {
        select.value = "";
        for (const option of select.options)
          option.hidden =
            option.value !== "" &&
            !matches.includes(state.S.user.customers[Number(option.value)]);
      }
    }

    if (f?.id === "order-form" && e.target.name === "pickupAddress") {
      const address = state.S.user.addresses?.find((a) => a.id === e.target.value);
      state.wizard.data.sender = e.target.value === "new"
        ? { name: state.S.user.name, phone: state.S.user.phone, province: state.S.user.province }
        : { ...state.S.user, ...address, addressId: address?.id || "" };
      state.wizard.data.pickupChoice = e.target.value;
      ui.formRevision++;
      render();
    }
    if (f?.id === "order-form" && e.target.name === "savedCustomer") {
      state.wizard.data.notes = f.elements.notes?.value || "";
      state.wizard.data.recipient = e.target.value === ""
        ? { phone: f.elements.phone.value, province: state.S.user.province }
        : clone(state.S.user.customers[Number(e.target.value)]);
      ui.formRevision++;
      render();
    }
  });
  let searchTimer;
  onEvent("input", (e) => {
    const field = e.target;
    // Phone fields accept English digits only and never exceed eleven characters.
    if (PHONE_FIELDS.has(field.name) && typeof field.value === "string") {
      const clean = phoneDigits(field.value);
      if (clean !== field.value) {
        const at = field.selectionStart ?? clean.length;
        field.value = clean;
        const next = Math.min(at, clean.length);
        try {
          field.setSelectionRange(next, next);
        } catch {
          /* Some input types expose no caret; overwriting the value is enough. */
        }
      }
    }
    if (field.name === "phone" && field.form?.id === "order-form" && state.wizard?.step === 2) {
      for (const handler of handlers.change || []) handler(e);
    }
    if (field.id === "order-search") {
      const pos = e.target.selectionStart;
      state.query = e.target.value;
      state.registryPage = 1;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        render();
        const input = $("#order-search");
        input.focus();
        input.setSelectionRange(pos, pos);
      }, 250);
    }
  });
  onEvent("keydown", (e) => {
    const menu = $("#status-menu");
    if (!menu?.matches(":popover-open")) return;
    const options = [...menu.querySelectorAll("[role=option]")],
      index = options.indexOf(document.activeElement);
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? options.length - 1
            : (index + (e.key === "ArrowDown" ? 1 : -1) + options.length) %
              options.length;
      options[next].focus();
    }
    if (e.key === "Escape")
      $("#status-trigger").setAttribute("aria-expanded", "false");
  });
  const standaloneMode = window.matchMedia("(display-mode: standalone)");
  let installedThisSession = false;
  function updateInstallBanner() {
    ui.installed =
      installedThisSession ||
      standaloneMode.matches ||
      navigator.standalone === true;
    ui.installVisible = !ui.installed;
  }
  async function requestAppInstall(button) {
    if (
      standaloneMode.matches ||
      navigator.standalone === true ||
      installedThisSession
    ) {
      updateInstallBanner();
      return;
    }
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      button.disabled = true;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") {
          installedThisSession = true;
          updateInstallBanner();
        }
      } finally {
        button.disabled = false;
      }
    } else {
      const ios =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      modal(
        "تثبيت واصل",
        ios
          ? h("p", {}, [
              "افتح الرابط في Safari، ثم اضغط «مشاركة» واختر «إضافة إلى الشاشة الرئيسية»، ثم «إضافة».",
            ])
          : [
              h("p", {}, [
                "من قائمة المتصفح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
              ]),
              h("p", {}, [
                "إذا فتحت الرابط داخل تطبيق آخر، افتحه في Chrome أو Edge أولاً. قد تحتاج زيارة الصفحة مجددًا حتى يتيح المتصفح التثبيت.",
              ]),
            ],
      );
    }
  }
  listen(window, "beforeinstallprompt", (e) => {
    e.preventDefault();
    installPrompt = e;
    updateInstallBanner();
  });
  listen(window, "appinstalled", () => {
    installPrompt = null;
    installedThisSession = true;
    updateInstallBanner();
  });
  listen(standaloneMode, "change", updateInstallBanner);
  listen(window, "offline", () => {
    // Keep saved records available, hide live availability until connected.
    state.offline = navigator.onLine === false;
    if (state.S) refresh(!state.wizard && !$("#app-dialog").open);
  });
  listen(window, "online", () => {
    if (state.S) refresh(!state.wizard && !$("#app-dialog").open);
  });
  // Adapted from the supplied Bal3D interaction, keeping the existing wallet artwork.
  function stopWalletMotion() {}
  function initWalletMotion() {}
  ("use strict");
  const courierDocs = {
    residenceFront: "الوجه الأمامي لبطاقة السكن",
    nationalFront: "الوجه الأمامي للبطاقة الوطنية",
    nationalBack: "الوجه الخلفي للبطاقة الوطنية",
    licenseFront: "الوجه الأمامي لإجازة السوق",
    licenseBack: "الوجه الخلفي لإجازة السوق",
  };
  let documentStream = null,
    documentCapture = null,
    cameraFacing = "environment",
    cameraGeneration = 0;
  function gatherCourier() {
    const f = document.querySelector("#courier-register-form");
    if (!f) return;
    for (const [k, v] of new FormData(f))
      if (typeof v === "string") state.registration[k] = v;
    state.registration.location = {
      lat: Number(f.elements.lat.value),
      lng: Number(f.elements.lng.value),
    };
  }
  function stopDocumentCamera() {
    ui.cameraReady = false;
    ui.cameraError = "";
    cameraGeneration++;
    if (documentStream) documentStream.getTracks().forEach((t) => t.stop());
    documentStream = null;
  }
  function cameraDialog() {
    return $("#document-camera-dialog");
  }
  async function startDocumentCamera() {
    stopDocumentCamera();
    const gen = cameraGeneration;
    if (!documentCapture) return;
    documentCapture.photo = null;
    drawDocumentCamera();
    await nextTick();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      ui.cameraError =
        "الكاميرا تحتاج رابط HTTPS. يمكنك اختيار صورة من الجهاز.";
      return;
    }
    const start = $('[data-action="document-start"]');
    if (start) start.disabled = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: cameraFacing,
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 960,
          },
        },
        audio: false,
      });
      if (
        gen !== cameraGeneration ||
        !documentCapture ||
        !cameraDialog().open
      ) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      documentStream = stream;
      const video = $("#document-camera-dialog video");
      video.srcObject = stream;
      await video.play();
      if (gen !== cameraGeneration) return;
      ui.cameraReady = true;
      drawDocumentCamera();
      await nextTick();
    } catch (err) {
      if (gen !== cameraGeneration) return;
      ui.cameraError =
        err.name === "NotAllowedError"
          ? "لم يُسمح بالكاميرا. فعّل الإذن أو اختر صورة من الجهاز."
          : "تعذّر فتح الكاميرا. جرّب مجدداً أو اختر صورة من الجهاز.";
      if (start) start.disabled = false;
    }
  }
  onEvent("click", async (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const a = b.dataset.action;
    try {
      if (a === "courier-password") {
        const input = $(
            `#courier-register-form input[name="${b.dataset.field}"]`,
          ),
          visible = input.type === "password";
        input.type = visible ? "text" : "password";
        b.textContent = visible ? "إخفاء" : "إظهار";
        b.setAttribute("aria-pressed", String(visible));
        b.setAttribute(
          "aria-label",
          (visible ? "إخفاء " : "إظهار ") +
            (b.dataset.field === "password"
              ? "كلمة المرور"
              : "تأكيد كلمة المرور"),
        );
      } else if (a === "document-open") {
        gatherCourier();
        documentCapture = {
          key: b.dataset.document,
          photo: state.registration.documents[b.dataset.document] || null,
        };
        drawDocumentCamera();
      } else if (a === "document-start" || a === "document-retake")
        await startDocumentCamera();
      else if (a === "document-flip") {
        cameraFacing = cameraFacing === "environment" ? "user" : "environment";
        await startDocumentCamera();
      } else if (a === "document-close") cameraDialog().close();
      else if (a === "document-shoot") {
        const video = $("#document-camera-dialog video");
        if (!video?.videoWidth) throw Error("انتظر جاهزية الكاميرا");
        const canvas = document.createElement("canvas"),
          ratio = Math.min(1, 900 / video.videoWidth);
        canvas.width = video.videoWidth * ratio;
        canvas.height = video.videoHeight * ratio;
        canvas
          .getContext("2d")
          .drawImage(video, 0, 0, canvas.width, canvas.height);
        documentCapture.photo = canvas.toDataURL("image/jpeg", 0.75);
        stopDocumentCamera();
        drawDocumentCamera();
      } else if (a === "document-save") {
        const { key, photo } = documentCapture;
        if (!photo) throw Error("التقط الصورة أولاً");
        state.registration.documents[key] = photo;
        cameraDialog().close();
        courierRegistrationView();
        $(`[data-document="${key}"]`)?.focus();
      } else if (a === "courier-step-back") {
        gatherCourier();
        state.registration.step = Math.max(
          0,
          (state.registration.step || 0) - 1,
        );
        courierRegistrationView();
      } else if (a === "courier-edit") {
        closeModal();
        courierRegistrationView();
      } else if (a === "courier-confirm") {
        b.disabled = true;
        await api("/api/register", state.registration);
        const r = state.registration;
        closeModal();
        await login("courier", r.phone, r.password);
        state.registration = null;
        toast("تم إنشاء حساب المندوب");
      }
    } catch (err) {
      toast(err.message);
      b.disabled = false;
    }
  });
  onEvent("change", async (e) => {
    const input = e.target;
    if (!input.matches("[data-document-upload],[data-camera-upload]")) return;
    const file = input.files?.[0];
    if (!file) return;
    try {
      gatherCourier();
      const photo = await imageData(file);
      if (photo.length > 600000)
        throw Error("الصورة كبيرة؛ جرّب صورة أوضح وأصغر");
      if (input.hasAttribute("data-camera-upload")) {
        if (!documentCapture) return;
        stopDocumentCamera();
        documentCapture.photo = photo;
        drawDocumentCamera();
      } else {
        const key = input.dataset.documentUpload;
        state.registration.documents[key] = photo;
        courierRegistrationView();
        $(`[data-document="${key}"]`)?.focus();
      }
    } catch (err) {
      toast(err.message);
    } finally {
      input.value = "";
    }
  });
  listen(window, "pagehide", stopDocumentCamera);
  listen(document, "visibilitychange", () => {
    if (document.hidden && documentStream) {
      stopDocumentCamera();
      if (documentCapture)
        drawDocumentCamera(
          "توقفت الكاميرا عند مغادرة الصفحة. اضغط فتح الكاميرا للمتابعة.",
        );
    }
  });
  const renderers = {
    AuthView: () => authView(ui.authError),
    HomeView: homeView,
    OrdersView: ordersView,
    OrderWizard: orderWizard,
    AccountView: accountView,
    WalletView: walletView,
    MerchantRegistration: merchantRegistrationView,
    CourierRegistration: courierView,
  };
  const views = Object.fromEntries(
    Object.entries(renderers).map(([name, view]) => [
      name,
      defineComponent({
        name,
        setup: () => () => {
          ui.revision;
          return view();
        },
      }),
    ]),
  );
  const Navigation = defineComponent({
    name: "AppNavigation",
    setup: () => () => (state.S ? nav() : null),
  });
  const SplashArt = defineComponent({
    name: "SplashArt",
    setup: () => () =>
      h("div", [
        splashScenery(),
        h(
          "div",
          {
            class: "splash-content",
          },
          [
            h("span", {
              class: "auth-logo-art",
              role: "img",
              "aria-label": "شعار واصل",
            }),
            h("strong", "واصل"),
            h(
              "span",
              {
                class: "splash-english",
                dir: "ltr",
                lang: "en",
              },
              "WASIL · FOR DELIVERY",
            ),
            h("p", "من بابك… لكل وجهة"),
            routeLines(),
          ],
        ),
      ]),
  });
  const currentView = computed(() => views[ui.page]);
  const title = computed(
    () =>
      ({
        home: "لوحة " + roleNames[state.S?.user.role],
        registry: "سجل الطلبات",
        available: "الطلبات المتاحة",
        wallet: "المحفظة",
        account: "حسابي",
        new: "طلب جديد",
      })[state.screen] || "واصل",
  );
  async function dispatch(type, event) {
    for (const fn of handlers[type] || []) await fn(event);
  }
  function cameraClosed() {
    stopDocumentCamera();
    documentCapture = null;
    ui.cameraContent = null;
    ui.cameraReady = false;
  }

  let restoringRoute = false;
  function writeRoute(role, page) {
    if (restoringRoute) return;
    const hash = routeHash(role, page);
    if (location.hash !== hash) history.pushState(null, "", hash);
  }
  async function restoreRoute() {
    restoringRoute = true;
    try {
      closeModal();
      cameraDialog()?.close();
      const route = parseRoute(location.hash);
      state.authRole = route.role;
      if (!route.role || route.page === "login") {
        state.S = null;
        state.registration = null;
        state.wizard = null;
        loginPage();
        return;
      }
      if (route.page === "register") {
        state.S = null;
        state.registration = {
          step: 0,
          role: route.role,
          activity: "shop",
          vehicle: "sedan",
          province: "بغداد",
          photos: [],
          documents: {},
          location: { lat: 33.3, lng: 44.43 },
        };
        registrationView();
        return;
      }
      state.registration = null;
      if (!state.S || state.S.user.role !== route.role) {
        await api("/api/login", { role: route.role });
        await refresh(false);
      }
      state.screen = route.page;
      state.filter = "all";
      state.homePage = 1;
      state.registryPage = 1;
      state.query = "";
      if (route.page === "new") {
        if (!state.wizard) startOrder();
        else render();
      } else {
        state.wizard = null;
        render();
      }
    } catch (error) {
      toast(error.message);
    } finally {
      restoringRoute = false;
    }
  }
  listen(window, "hashchange", restoreRoute);

  onMounted(() => {
    showWelcomeSplash().then(() => {
      restoreRoute();
      updateInstallBanner();
    });
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register(new URL("sw.js", document.baseURI), {
          updateViaCache: "none",
        })
        .then((r) => r.update())
        .catch(() => {});
    const interval = setInterval(() => {
      if (
        state.S &&
        !state.wizard &&
        !state.registration &&
        !$("#app-dialog").open &&
        !$("#status-menu")?.matches(":popover-open") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName,
        )
      )
        refresh();
      else if (state.S) refresh(false);
    }, 5000);
    cleanups.push(() => clearInterval(interval));
  });
  onBeforeUnmount(() => {
    cleanups.forEach((fn) => fn());
    clearTimeout(toastTimer);
    clearTimeout(searchTimer);
    stopDocumentCamera();
    if (state.trackingId !== null)
      navigator.geolocation.clearWatch(state.trackingId);
  });
  return {
    ui,
    state,
    currentView,
    Navigation,
    SplashArt,
    title,
    roleNames,
    dispatch,
    closeModal,
    cameraClosed,
    refresh,
    requestAppInstall,
  };
}
