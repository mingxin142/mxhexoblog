function encrypt() {
    switch (jQuery('input[name="encrypt_type"]:checked').val()) {
        case "aes":
            jQuery("#result").val(CryptoJS.AES.encrypt(jQuery("#content").val(), jQuery("#pwd").val()));
            break;
        case "des":
            jQuery("#result").val(CryptoJS.DES.encrypt(jQuery("#content").val(), jQuery("#pwd").val()));
            break;
        case "rabbit":
            jQuery("#result").val(CryptoJS.Rabbit.encrypt(jQuery("#content").val(), jQuery("#pwd").val()));
            break;
        case "rc4":
            jQuery("#result").val(CryptoJS.RC4.encrypt(jQuery("#content").val(), jQuery("#pwd").val()));
            break;
        case "tripledes":
            jQuery("#result").val(CryptoJS.TripleDES.encrypt(jQuery("#content").val(), jQuery("#pwd").val()));
            break;
    }
}
function decrypt() {
    switch (jQuery('input[name="encrypt_type"]:checked').val()) {
        case "aes":
            jQuery("#result").val(CryptoJS.AES.decrypt(jQuery("#content").val(), jQuery("#pwd").val()).toString(CryptoJS.enc.Utf8));
            break;
        case "des":
            jQuery("#result").val(CryptoJS.DES.decrypt(jQuery("#content").val(), jQuery("#pwd").val()).toString(CryptoJS.enc.Utf8));
            break;
        case "rabbit":
            jQuery("#result").val(CryptoJS.Rabbit.decrypt(jQuery("#content").val(), jQuery("#pwd").val()).toString(CryptoJS.enc.Utf8));
            break;
        case "rc4":
            jQuery("#result").val(CryptoJS.RC4.decrypt(jQuery("#content").val(), jQuery("#pwd").val()).toString(CryptoJS.enc.Utf8));
            break;
        case "tripledes":
            jQuery("#result").val(CryptoJS.TripleDES.decrypt(jQuery("#content").val(), jQuery("#pwd").val()).toString(CryptoJS.enc.Utf8));
            break;
    }
}
function resetAll() {
    $("#pwd").val("");
    $("#content").val("");
    $("#result").val("");
    document.getElementById("content").select();
}