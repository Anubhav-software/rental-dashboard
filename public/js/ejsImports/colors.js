// =========================== Copy Color Code when click on box Js Start ================================
$('.color-box').click(function () {
    var clipboardText = $(this).find('[data-clipboard-text]').attr('data-clipboard-text');

    // Create a temporary input element to hold the text to copy
    var tempInput = $('<input>');
    $('body').append(tempInput);
    tempInput.val(clipboardText).select();

    // Copy the text to the clipboard
    document.execCommand('copy');

    // Remove the temporary input element
    tempInput.remove();


    // Remove any existing badge
    $(this).find('.copied-message').remove();

    // Create the notification badge
    var $badge = $(`<span class='copied-message text-xs badge bg-success-main py-8 px-12 fw-normal rounded-pill position-absolute start-50 translate-middle-x top-0 mt-24'>    Copied! </span>`)

    // Append the badge to the color box
    $(this).append($badge);

    // Show the badge and then fade it out
    $badge.fadeIn().delay(800).fadeOut(function () {
        $(this).remove();
    });

});
// =========================== Copy Color Code when click on box Js End ================================