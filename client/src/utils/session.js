export const session = {
    save(token, clientId) {
        sessionStorage.setItem('tt_token', token);
        sessionStorage.setItem('tt_cid', clientId);
    },
    getToken() {
        return sessionStorage.getItem('tt_token');
    },
    getClientId() {
        return sessionStorage.getItem('tt_cid');
    },
    clear() {
        sessionStorage.clear();
    },
    isAuthenticated() {
        return !!this.getToken();
    }
};