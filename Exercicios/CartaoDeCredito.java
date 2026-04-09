import java.util.ArrayList;
import java.util.List;

public class CartaoDeCredito {
    private int numero;
    private String dataDeValidade;
    private Cliente cliente;
    private double limite = 1000; // Limite padrão do cartão
    private List<String> historico = new ArrayList<>();

    public void setNumero(int numero) {
        this.numero = numero;
    }

    public int getNumero() {
        return numero;
    }

    public void setDataDeValidade(String dataDeValidade) {
        this.dataDeValidade = dataDeValidade;
    }

    public String getDataDeValidade() {
        return dataDeValidade;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setLimite(double limite) {
        this.limite = limite;
    }

    public double getLimite() {
        return limite;
    }

    public boolean compra(double valor) {
        if (valor > 0 && valor <= limite) {
            limite -= valor;
            historico.add("Compra de R$ " + String.format("%.2f", valor) + " em " + java.time.LocalDate.now());
            return true;
        }
        return false;
    }

    public double limiteDisponivel() {
        return limite;
    }

    public List<String> getHistorico() {
        return new ArrayList<>(historico);
    }
}