const getAllCurrencies                = require('../../get_currency').getAllCurrencies;
const getCurrenciesOfOtherAccounts = require('../../get_currency').getCurrenciesOfOtherAccounts;
const BinarySocket                 = require('../../../../base/socket');
const Client                       = require('../../../../base/client');
const getCurrencyFullName          = require('../../../../common/currency').getCurrencyFullName;
const localize                     = require('../../../../../_common/localize').localize;
const Url                          = require('../../../../../_common/url');
const isCryptocurrency             = require('../../../../../_common/base/currency_base').isCryptocurrency;
const hasAccountType               = require('../../../../../_common/base/client_base').hasAccountType;
const hasCurrencyType              = require('../../../../../_common/base/client_base').hasCurrencyType;
const hasOnlyCurrencyType          = require('../../../../../_common/base/client_base').hasOnlyCurrencyType;

const AccountClosure = (() => {
    const form_selector = '#form_closure';
    let $form,
        $txt_other_reason,
        $closure_loading,
        $submit_loading,
        $closure_container,
        $trading_limit,
        $fiat_1,
        $fiat_2,
        $crypto_1,
        $crypto_2,
        $virtual,
        $success_msg,
        $error_msg;

    const onLoad = () => {
        $txt_other_reason   = $('#other_reason');
        $closure_loading    = $('#closure_loading');
        $submit_loading     = $('#submit_loading');
        $closure_container  = $('#closure_container');
        $success_msg        = $('#msg_main');
        $error_msg          = $('#msg_form');
        $trading_limit      = $('.trading_limit');
        $virtual            = $('.virtual');
        $crypto_1           = $('.crypto_1');
        $crypto_2           = $('.crypto_2');
        $fiat_1             = $('.fiat_1');
        $fiat_2             = $('.fiat_2');
        $form               = $(form_selector);

        $closure_loading.setVisibility(1);

        const is_virtual        = !hasAccountType('real');
        const has_trading_limit = hasAccountType('real');
        const is_fiat           = hasOnlyCurrencyType('fiat');
        const is_crypto         = hasOnlyCurrencyType('crypto');
        const is_both           = hasCurrencyType('fiat') && hasCurrencyType('crypto');
        const current_email     = Client.get('email');
        const current_currency  = Client.get('currency');

        BinarySocket.wait('landing_company').then((response) => {
            const currencies = getAllCurrencies(response.landing_company);
            const other_currencies = getCurrenciesOfOtherAccounts(true);
            console.log(other_currencies)
            console.log(currencies)

            if (is_virtual) {
                $virtual.setVisibility(1);
                currencies.forEach((currency) => {
                    $virtual.find('ul').append(`<li>${getCurrencyFullName(currency)}</li>`);
                });
                
            } else {
                if (is_fiat) {
                    $fiat_1.setVisibility(1);
                    $fiat_2.setVisibility(1);

                    let fiat_currency = '';

                    if (Client.get('is_virtual')) {
                        other_currencies.forEach((currency) => {
                            if (!isCryptocurrency(currency)) {
                                fiat_currency = currency;
                            }
                        });
                    } else {
                        fiat_currency = Client.get('currency');
                    }

                    $('#current_currency_fiat').text(fiat_currency);
                    $('.current_currency').text(fiat_currency);

                    currencies.forEach((currency) => {
                        let is_allowed = true;
                        other_currencies.forEach((other_currency) => {
                            if (currency === other_currency) {
                                is_allowed = false;
                            }
                        });
                        if (is_allowed) {
                            if (isCryptocurrency(currency)) {
                                $fiat_2.find('ul').append(`<li>${getCurrencyFullName(currency)}</li>`);
                            } else {
                                $fiat_1.find('ul').append(`<li>${getCurrencyFullName(currency)}</li>`);
                            }
                        }
                    });
                }

                if (is_crypto) {
                    $crypto_1.setVisibility(1);
                    $crypto_2.setVisibility(1);
                    let crypto_currencies = '';
                    let has_all_crypto = true;

                    if (!Client.get('is_virtual')) {
                        crypto_currencies = Client.get('currency');
                    }

                    other_currencies.forEach((currency) => {
                        if (isCryptocurrency(currency)) {
                            if (!crypto_currencies) {
                                crypto_currencies += currency;
                            } else {
                                crypto_currencies += `, ${currency}`;
                            }
                        }
                    });
                
                    $('.current_currency').text(crypto_currencies);
                    $('#current_currency_crypto').text(crypto_currencies);
                    currencies.forEach((currency) => {
                        let is_allowed = true;
                        other_currencies.forEach((other_currency) => {
                            if (currency === other_currency) {
                                is_allowed = false;
                            }
                        });
                        if (is_allowed) {
                            if (isCryptocurrency(currency)) {
                                has_all_crypto = false;
                                $crypto_2.find('ul').append(`<li>${getCurrencyFullName(currency)}</li>`);
                            } else {
                                $crypto_1.find('ul').append(`<li>${getCurrencyFullName(currency)}</li>`);
                            }
                        }
                    });

                    if (has_all_crypto) {
                        $crypto_2.setVisibility(0);
                    }
                }

                if (is_both) {
                    $fiat_1.setVisibility(1);
                    $crypto_2.setVisibility(1);
                    let crypto_currencies = '';
                    let has_all_crypto = true;

                    if (isCryptocurrency(current_currency)) {
                        crypto_currencies = Client.get('currency');
                        other_currencies.forEach(currency => {
                            if (isCryptocurrency(currency)) {
                                crypto_currencies += `, ${currency}`;
                            } else {
                                $('#current_currency_fiat').text(currency);
                                $('.current_currency').text(currency);
                            }
                        });
                        $('#current_currency_crypto').text(crypto_currencies);
                    } else {
                        let fiat_currency = '';

                        if (Client.get('is_virtual')) {
                            other_currencies.forEach((currency) => {
                                if (isCryptocurrency(currency)) {
                                    if (!crypto_currencies) {
                                        crypto_currencies += currency;
                                    } else {
                                        crypto_currencies += `, ${currency}`;
                                    }
                                } else {
                                    fiat_currency = currency;
                                    // eslint-disable-next-line
                                    if (Client.get('is_virtual')) {
                                        fiat_currency = currency;
                                    } else {
                                        fiat_currency = current_currency;
                                    }
                                }
                            });
                        } else {
                            other_currencies.forEach((currency) => {
                                if (isCryptocurrency(currency)) {
                                    if (!crypto_currencies) {
                                        crypto_currencies += currency;
                                    } else {
                                        crypto_currencies += `, ${currency}`;
                                    }
                                }
                            });

                            fiat_currency = current_currency;
                        }

                        $('#current_currency_fiat').text(fiat_currency);
                        $('.current_currency').text(fiat_currency);
                        $('#current_currency_crypto').text(crypto_currencies);
                    }

                    currencies.forEach((currency) => {
                        let is_allowed = true;
                        other_currencies.forEach((other_currency) => {
                            if (currency === other_currency) {
                                is_allowed = false;
                            }
                        });
                        if (is_allowed) {
                            if (isCryptocurrency(currency)) {
                                has_all_crypto = false;
                                $crypto_2.find('ul').append(`<li>${getCurrencyFullName(currency)}</li>`);
                            } else {
                                $fiat_1.find('ul').append(`<li>${getCurrencyFullName(currency)}</li>`);
                            }
                        }
                    });

                    if (has_all_crypto) {
                        $crypto_2.setVisibility(0);
                    }

                }
                if (has_trading_limit) {
                    $trading_limit.setVisibility(1);
                    $('#closing_steps').setVisibility(1);
                }
            }

            $('#current_email').text(current_email);
            $closure_loading.setVisibility(0);

            $closure_container.setVisibility(1);
        }).catch((error) => {
            showFormMessage(error.message);
            $closure_loading.setVisibility(0);
            $closure_container.setVisibility(1);
        });

        $('#closure_accordion').accordion({
            heightStyle: 'content',
            collapsible: true,
            active     : true,
        });

        $(form_selector).on('submit', (event) => {
            event.preventDefault();
            submitForm();
        });

        $txt_other_reason.on('keyup', () => {
            const input = $txt_other_reason.val();
            if (input && validateReasonTextField(false)) {
                $txt_other_reason.removeClass('error-field');
                $error_msg.css('display', 'none');
            }
        });
    };

    const submitForm = () => {
        const $btn_submit = $form.find('#btn_submit');
        const reason = getReason();
        if (reason) {
            $submit_loading.setVisibility(1);
            $btn_submit.attr('disabled', true);

            const data  = { account_closure: 1, reason };
            BinarySocket.send(data).then((response) => {
                if (response.error) {
                    $submit_loading.setVisibility(0);
                    showFormMessage(response.error.message || localize('Sorry, an error occurred while processing your request.'));
                    $btn_submit.attr('disabled', false);
                } else {
                    $submit_loading.setVisibility(0);
                    $closure_container.setVisibility(0);
                    $success_msg.setVisibility(1);

                    setTimeout(() => window.location.href = Url.urlFor('home'), 10000);
                }
            });
        } else {
            setTimeout(() => { $btn_submit.removeAttr('disabled'); }, 1000);
        }
    };

    const showFormMessage = (localized_msg, scroll_on_error) => {
        if (scroll_on_error) $.scrollTo($('#reason'), 500, { offset: -20 });
        $error_msg
            .attr('class', 'errorfield')
            .html(localized_msg)
            .css('display', 'block');
    };

    const validateReasonTextField = (scroll_on_error) => {
        const other_reason_input = $txt_other_reason.val();

        if (!other_reason_input) {
            $txt_other_reason.addClass('error-field');
            showFormMessage(localize('Please specify the reasons for closing your accounts'), scroll_on_error);
            return false;
        } else if (other_reason_input.length < 5 || other_reason_input.length > 250) {
            $txt_other_reason.addClass('error-field');
            showFormMessage(localize('The reason should be between 5 and 250 characters'), scroll_on_error);
            return false;
        } else if (!/^[0-9A-Za-z .,'-]{5,250}$/.test(other_reason_input)) {
            $txt_other_reason.addClass('error-field');
            showFormMessage(localize('Only letters, numbers, space, hyphen, period, comma, and apostrophe are allowed.'), scroll_on_error);
            return false;
        }
        return true;
    };

    const getReason = () => {
        const $selected_reason   = $('#reason input[type=radio]:checked');
        const reason_radio_val   = $selected_reason.val();
        const reason_radio_id    = $selected_reason.attr('id');
        const reason_radio_text  = $(`label[for=${reason_radio_id }]`).text();
        const other_reason_input = $txt_other_reason.val();

        if (reason_radio_val) {
            if (reason_radio_val === 'other') {
                if (validateReasonTextField(true)){
                    return other_reason_input;
                }
                return false;
            }
            return reason_radio_text;
        }
        showFormMessage(localize('Please select a reason.'));
        return false;
    };

    return {
        onLoad,
    };
})();

module.exports = AccountClosure;
